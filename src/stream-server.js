const crypto = require('crypto');
const http = require('http');
const { createClient } = require('redis');
const { WebSocket, WebSocketServer } = require('ws');
const {
    PORT,
    STREAM_SECRET,
    MAX_TOKEN_TTL,
    PRODUCER_MAX_TOKEN_TTL,
    REDIS_URL,
    REDIS_NAMESPACE,
    ALLOWED_ORIGINS: allowedOrigins,
    BROKER_OUTAGE_GRACE_MS,
    MAX_SOCKET_BUFFERED_BYTES,
    PRODUCER_LEASE_TTL_MS,
    PRODUCER_LEASE_RENEW_MS,
    MAX_LOCAL_SESSIONS,
    MAX_LOCAL_CLIENTS_PER_RUN,
    CONTROL_RATE_PER_SECOND,
    CONTROL_BURST,
    CONTROL_COALESCE_MS,
    MAX_PENDING_PUBLISHES,
    MAX_PENDING_CRITICAL_PUBLISHES,
    REDIS_COMMAND_TIMEOUT_MS,
    SHUTDOWN_GRACE_MS,
} = require('./stream-server-config');

const ALLOWED_ORIGINS = parseAllowedOrigins(allowedOrigins);
const PING_INTERVAL = 10000;
const CLIENT_MAX_PAYLOAD = 64 * 1024;
const PRODUCER_MAX_PAYLOAD = 16 * 1024 * 1024;
const EVENT_BINARY_HEADER = Buffer.from([0x50, 0x46, 0x01]);
const FRAME_METADATA_LENGTH_BYTES = 4;
const CRITICAL_PUBLISH_RETRIES = 3;
const CRITICAL_PUBLISH_RETRY_MS = 25;
const STATUS_VALUES = new Set(['connecting', 'streaming', 'ended']);
const COALESCED_CONTROL_TYPES = new Set(['mousemove', 'wheel']);
const CONTROL_TYPES = new Set([
    'mousemove', 'mousedown', 'mouseup', 'wheel', 'keydown', 'keyup',
    'copy', 'cut', 'paste', 'navigate', 'goBack', 'goForward', 'requestFrame', 'switchTab',
]);

const redisOptions = {
    url: REDIS_URL,
    disableOfflineQueue: true,
    commandOptions: {
        timeout: REDIS_COMMAND_TIMEOUT_MS,
    },
    socket: {
        reconnectStrategy: (retries) => Math.min(50 * (2 ** Math.min(retries, 6)), 2000)
            + Math.floor(Math.random() * 200),
    },
};
const publisher = createClient(redisOptions);
const subscriber = publisher.duplicate();
const sessions = new Map();
const subscriptions = new Map();
const RENEW_LEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0`;
const RELEASE_LEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0`;
const FENCED_PUBLISH_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PUBLISH", KEYS[2], ARGV[2])
end
return -1`;
let publisherReady = false;
let subscriberReady = false;
let brokerWasReady = false;
let brokerReadyState = false;
let brokerOutageTimer = null;
let shuttingDown = false;
let pendingPublishes = 0;
let pendingCriticalPublishes = 0;

publisher.on('error', () => {
    console.error('[stream] Redis publisher error');
    setPublisherReady(publisher.isReady);
});
publisher.on('ready', () => setPublisherReady(true));
publisher.on('reconnecting', () => setPublisherReady(false));
publisher.on('end', () => setPublisherReady(false));

subscriber.on('error', () => {
    console.error('[stream] Redis subscriber error');
    setSubscriberReady(subscriber.isReady);
});
subscriber.on('ready', () => setSubscriberReady(true));
subscriber.on('reconnecting', () => setSubscriberReady(false));
subscriber.on('end', () => setSubscriberReady(false));

function parseAllowedOrigins(value) {
    const rules = splitOriginRules(value);
    const exact = new Set();
    const patterns = [];
    const regexDelimiters = new Set(['/', '#', '~']);
    let allowAny = false;

    for (const rule of rules) {
        if (rule === '*') {
            allowAny = true;
            continue;
        }

        const delimiter = rule[0];
        if (regexDelimiters.has(delimiter)) {
            const closingDelimiter = rule.lastIndexOf(delimiter);
            if (closingDelimiter === 0) {
                throw new Error(`Invalid browser stream origin regex: ${rule}`);
            }
            try {
                patterns.push(new RegExp(
                    rule.slice(1, closingDelimiter),
                    rule.slice(closingDelimiter + 1),
                ));
            } catch {
                throw new Error(`Invalid browser stream origin regex: ${rule}`);
            }
            continue;
        }

        try {
            exact.add(new URL(rule).origin);
        } catch {
            throw new Error(`Invalid browser stream origin: ${rule}`);
        }
    }

    return { allowAny, exact, patterns };
}

function splitOriginRules(value) {
    const rules = [];
    let current = '';
    let regexDelimiter = null;
    let inCharacterClass = false;
    let escaped = false;

    for (const character of value) {
        if (regexDelimiter === null && current.trim() === '' && ['/', '#', '~'].includes(character)) {
            regexDelimiter = character;
        } else if (regexDelimiter !== null) {
            if (escaped) {
                escaped = false;
            } else if (character === '\\') {
                escaped = true;
            } else if (character === '[') {
                inCharacterClass = true;
            } else if (character === ']') {
                inCharacterClass = false;
            } else if (character === regexDelimiter && !inCharacterClass) {
                regexDelimiter = null;
            }
        }

        if (character === ',' && regexDelimiter === null) {
            if (current.trim()) {
                rules.push(current.trim());
            }
            current = '';
            continue;
        }
        current += character;
    }

    if (current.trim()) {
        rules.push(current.trim());
    }
    return rules;
}

function isOriginAllowed(origin) {
    if (!origin) {
        return false;
    }
    if (ALLOWED_ORIGINS.allowAny || ALLOWED_ORIGINS.exact.has(origin)) {
        return true;
    }
    return ALLOWED_ORIGINS.patterns.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(origin);
    });
}

function isBrokerReady() {
    return publisherReady && subscriberReady && publisher.isReady && subscriber.isReady;
}

function setPublisherReady(ready) {
    publisherReady = ready;
    if (!ready) {
        for (const session of sessions.values()) {
            session.leaseReady = false;
        }
    }
    updateBrokerState();
}

function setSubscriberReady(ready) {
    subscriberReady = ready;
    updateBrokerState();
}

function updateBrokerState() {
    const ready = isBrokerReady();
    const wasReady = brokerReadyState;
    brokerReadyState = ready;
    if (ready) {
        if (brokerOutageTimer) {
            clearTimeout(brokerOutageTimer);
            brokerOutageTimer = null;
        }
        if (!wasReady) {
            brokerWasReady = true;
            console.log('[stream] Redis relay ready');
            setTimeout(() => {
                reconcileSubscriptions();
                resynchronizeRuns();
            }, 0);
        }
        return;
    }

    if (brokerWasReady && !brokerOutageTimer && !shuttingDown) {
        brokerOutageTimer = setTimeout(() => {
            brokerOutageTimer = null;
            if (!isBrokerReady()) {
                brokerWasReady = false;
                closeActiveRelaySockets();
            }
        }, BROKER_OUTAGE_GRACE_MS);
    }
}

function eventChannel(runId) {
    return `${REDIS_NAMESPACE}:run:{${runId}}:event`;
}

function controlChannel(runId) {
    return `${REDIS_NAMESPACE}:run:{${runId}}:control`;
}

function producerLeaseKey(runId) {
    return `${REDIS_NAMESPACE}:run:{${runId}}:producer`;
}

function queueSubscription(channel, operation) {
    const entry = subscriptions.get(channel);
    if (!entry) {
        return Promise.resolve();
    }
    entry.queue = entry.queue.then(operation, operation);
    return entry.queue;
}

function acquireSubscription(channel, listener) {
    let entry = subscriptions.get(channel);
    if (!entry) {
        entry = { count: 0, subscribed: false, listener, queue: Promise.resolve() };
        subscriptions.set(channel, entry);
    }
    entry.count += 1;

    return queueSubscription(channel, async () => {
        if (entry.count > 0 && !entry.subscribed) {
            await subscriber.subscribe(channel, entry.listener, true);
            entry.subscribed = true;
        }
    }).catch((error) => {
        entry.count = Math.max(0, entry.count - 1);
        if (entry.count === 0 && !entry.subscribed) {
            subscriptions.delete(channel);
        }
        throw error;
    });
}

function releaseSubscription(channel) {
    const entry = subscriptions.get(channel);
    if (!entry) {
        return Promise.resolve();
    }
    entry.count = Math.max(0, entry.count - 1);

    return queueSubscription(channel, async () => {
        if (entry.count === 0 && entry.subscribed) {
            await subscriber.unsubscribe(channel);
            entry.subscribed = false;
        }
        if (entry.count === 0 && !entry.subscribed) {
            subscriptions.delete(channel);
        }
    }).catch(() => {});
}

function reconcileSubscriptions() {
    for (const [channel, entry] of subscriptions) {
        queueSubscription(channel, async () => {
            if (entry.count === 0 && entry.subscribed) {
                await subscriber.unsubscribe(channel);
                entry.subscribed = false;
            } else if (entry.count > 0 && !entry.subscribed) {
                await subscriber.subscribe(channel, entry.listener, true);
                entry.subscribed = true;
            }
            if (entry.count === 0 && !entry.subscribed) {
                subscriptions.delete(channel);
            }
        }).catch(() => {});
    }
}

function reservePublishSlot(critical = false) {
    if (!isBrokerReady()) {
        return false;
    }
    if (pendingPublishes >= MAX_PENDING_PUBLISHES + MAX_PENDING_CRITICAL_PUBLISHES) {
        return false;
    }
    if (critical) {
        pendingCriticalPublishes += 1;
    } else if (pendingPublishes - pendingCriticalPublishes >= MAX_PENDING_PUBLISHES) {
        return false;
    }
    pendingPublishes += 1;
    return true;
}

function releasePublishSlot(critical = false) {
    pendingPublishes -= 1;
    if (critical) {
        pendingCriticalPublishes -= 1;
    }
}

async function publish(channel, payload, critical = false, requireSubscriber = false) {
    if (!reservePublishSlot(critical)) {
        return false;
    }
    try {
        const subscribers = await publisher.publish(channel, payload);
        return !requireSubscriber || subscribers > 0;
    } catch {
        return false;
    } finally {
        releasePublishSlot(critical);
    }
}

async function acquireProducerLease(runId, owner) {
    if (!publisher.isReady) {
        return false;
    }
    const commandStartedAt = Date.now();
    try {
        const acquired = await publisher.set(producerLeaseKey(runId), owner, {
            NX: true,
            PX: PRODUCER_LEASE_TTL_MS,
        }) === 'OK';
        return acquired ? commandStartedAt : false;
    } catch {
        return false;
    }
}

async function renewProducerLease(runId, session) {
    if (!publisher.isReady || !session.leaseOwner) {
        session.leaseReady = false;
        return false;
    }
    const owner = session.leaseOwner;
    const commandStartedAt = Date.now();
    try {
        const renewed = await publisher.eval(RENEW_LEASE_SCRIPT, {
            keys: [producerLeaseKey(runId)],
            arguments: [owner, String(PRODUCER_LEASE_TTL_MS)],
        });
        if (session.leaseOwner !== owner) {
            return false;
        }
        session.leaseReady = renewed === 1;
        if (session.leaseReady) {
            session.leaseValidUntil = commandStartedAt
                + PRODUCER_LEASE_TTL_MS
                - PRODUCER_LEASE_RENEW_MS;
        }
        return session.leaseReady;
    } catch {
        session.leaseReady = false;
        return false;
    }
}

async function releaseProducerLease(runId, owner) {
    if (!owner || !publisher.isReady) {
        return false;
    }
    try {
        return await publisher.eval(RELEASE_LEASE_SCRIPT, {
            keys: [producerLeaseKey(runId)],
            arguments: [owner],
        }) === 1;
    } catch {
        return false;
    }
}

function encodeJsonEnvelope(type, payload) {
    return Buffer.from(JSON.stringify({ v: 1, t: type, p: payload }));
}

function decodeJsonEnvelope(raw, expectedType, validator) {
    if (!Buffer.isBuffer(raw) || raw.length > CLIENT_MAX_PAYLOAD + 64) {
        return null;
    }
    try {
        const envelope = JSON.parse(raw.toString('utf8'));
        if (!isPlainObject(envelope)
            || envelope.v !== 1
            || envelope.t !== expectedType
            || !validator(envelope.p)) {
            return null;
        }
        return envelope.p;
    } catch {
        return null;
    }
}

function encodeFrame(metadata, frame) {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataLength = Buffer.allocUnsafe(FRAME_METADATA_LENGTH_BYTES);
    metadataLength.writeUInt32BE(metadataBuffer.length);
    return Buffer.concat([EVENT_BINARY_HEADER, metadataLength, metadataBuffer, frame]);
}

async function publishOwned(runId, session, payload, critical = false, retries = 0) {
    if (!session.leaseReady
        || !session.leaseOwner
        || session.leaseValidUntil <= Date.now()
        || sessions.get(runId) !== session) {
        return false;
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        if (!reservePublishSlot(critical)) {
            if (attempt < retries) {
                await delay(CRITICAL_PUBLISH_RETRY_MS * (2 ** attempt));
                continue;
            }
            return false;
        }
        try {
            const published = await publisher.eval(FENCED_PUBLISH_SCRIPT, {
                keys: [producerLeaseKey(runId), eventChannel(runId)],
                arguments: [session.leaseOwner, payload],
            });
            if (published === -1) {
                session.leaseReady = false;
                return false;
            }
            return true;
        } catch {
            if (attempt >= retries) {
                return false;
            }
        } finally {
            releasePublishSlot(critical);
        }
        await delay(CRITICAL_PUBLISH_RETRY_MS * (2 ** attempt));
    }
    return false;
}

function decodeFrame(raw) {
    const headerLength = EVENT_BINARY_HEADER.length + FRAME_METADATA_LENGTH_BYTES;
    if (!Buffer.isBuffer(raw)
        || raw.length <= headerLength
        || raw.length > PRODUCER_MAX_PAYLOAD + CLIENT_MAX_PAYLOAD + headerLength
        || !raw.subarray(0, EVENT_BINARY_HEADER.length).equals(EVENT_BINARY_HEADER)) {
        return null;
    }
    const metadataLength = raw.readUInt32BE(EVENT_BINARY_HEADER.length);
    const metadataStart = headerLength;
    const frameStart = metadataStart + metadataLength;
    if (metadataLength < 1 || metadataLength > CLIENT_MAX_PAYLOAD || frameStart >= raw.length) {
        return null;
    }
    try {
        const metadata = JSON.parse(raw.subarray(metadataStart, frameStart).toString('utf8'));
        if (!isProducerMessage(metadata) || metadata.type !== 'frame-meta') {
            return null;
        }
        return {
            metadata,
            frame: raw.subarray(frameStart),
        };
    } catch {
        return null;
    }
}

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createSession() {
    return {
        producer: null,
        producerAlive: false,
        producerPing: null,
        leaseOwner: null,
        leaseReady: false,
        leaseValidUntil: 0,
        leaseRenewal: null,
        leaseRenewing: false,
        clients: new Set(),
        pendingFrameMetadata: null,
    };
}

function getSession(runId) {
    let session = sessions.get(runId);
    if (!session) {
        session = createSession();
        sessions.set(runId, session);
    }
    return session;
}

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, { ok: true });
        return;
    }
    if (req.method === 'GET' && req.url === '/ready') {
        sendJson(res, isBrokerReady() ? 200 : 503, { ready: isBrokerReady() });
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

const producerWss = new WebSocketServer({ noServer: true, maxPayload: PRODUCER_MAX_PAYLOAD });
const clientWss = new WebSocketServer({ noServer: true, maxPayload: CLIENT_MAX_PAYLOAD });

server.on('upgrade', (request, socket, head) => {
    if (shuttingDown || !isBrokerReady()) {
        rejectUpgrade(socket, 503, 'Service Unavailable');
        return;
    }

    let requestUrl;
    try {
        requestUrl = new URL(request.url, 'http://stream.internal');
    } catch {
        rejectUpgrade(socket, 401, 'Unauthorized');
        return;
    }

    const producerMatch = requestUrl.pathname.match(/^\/puppetflow\/(\d{1,20})$/);
    if (producerMatch) {
        const expiresAt = verifyCapability(request, producerMatch[1], 'producer');
        if (expiresAt === null) {
            rejectUpgrade(socket, 401, 'Unauthorized');
            return;
        }
        if (!sessions.has(producerMatch[1]) && sessions.size >= MAX_LOCAL_SESSIONS) {
            rejectUpgrade(socket, 503, 'Relay Capacity Reached');
            return;
        }
        producerWss.handleUpgrade(request, socket, head, (ws) => {
            handleProducerConnection(ws, producerMatch[1], expiresAt);
        });
        return;
    }

    const streamMatch = requestUrl.pathname.match(/^\/stream\/(\d{1,20})$/);
    if (streamMatch) {
        const capability = verifyBrowserCapability(request, streamMatch[1]);
        if (!capability) {
            rejectUpgrade(socket, 401, 'Unauthorized');
            return;
        }
        const existingSession = sessions.get(streamMatch[1]);
        if ((!existingSession && sessions.size >= MAX_LOCAL_SESSIONS)
            || (existingSession && existingSession.clients.size >= MAX_LOCAL_CLIENTS_PER_RUN)) {
            rejectUpgrade(socket, 503, 'Relay Capacity Reached');
            return;
        }
        clientWss.handleUpgrade(request, socket, head, (ws) => {
            handleClientConnection(ws, streamMatch[1], capability);
        });
        return;
    }

    socket.destroy();
});

function verifyBrowserCapability(request, runId) {
    if (!isOriginAllowed(request.headers.origin)) {
        return null;
    }
    for (const role of ['controller', 'viewer']) {
        const expiresAt = verifyCapability(request, runId, role);
        if (expiresAt !== null) {
            return { role, expiresAt };
        }
    }
    return null;
}

function verifyCapability(request, runId, role) {
    const protocols = String(request.headers['sec-websocket-protocol'] || '')
        .split(',')
        .map((value) => value.trim());
    const capability = protocols
        .map((value) => value.match(/^puppetflow-v1\.(\d+)\.([a-f0-9]{64})$/))
        .find(Boolean);
    const expiresValue = capability?.[1];
    const token = capability?.[2];
    if (!expiresValue || !/^\d+$/.test(expiresValue) || !token || !/^[a-f0-9]{64}$/.test(token)) {
        return null;
    }

    const expires = Number(expiresValue);
    const now = Math.floor(Date.now() / 1000);
    const maxTtl = role === 'producer' ? PRODUCER_MAX_TOKEN_TTL : MAX_TOKEN_TTL;
    if (!Number.isSafeInteger(expires) || expires <= now || expires > now + maxTtl) {
        return null;
    }

    const expected = crypto.createHmac('sha256', STREAM_SECRET)
        .update(`${runId}:${role}:${expires}`)
        .digest();
    const provided = Buffer.from(token, 'hex');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
        return null;
    }
    return expires;
}

function rejectUpgrade(socket, status, reason) {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
}

async function handleProducerConnection(ws, runId) {
    const owner = crypto.randomBytes(24).toString('hex');
    let closed = ws.readyState !== WebSocket.OPEN;
    let leaseHeld = false;
    let leaseReleased = false;
    let session = null;
    let sessionAttached = false;
    let subscriptionHeld = false;
    let subscriptionReleased = false;
    let terminalPublish = null;
    let framePublishPending = false;
    const cleanup = async () => {
        if (terminalPublish) {
            await terminalPublish;
        }
        const cleanupTasks = [];
        if (subscriptionHeld && !subscriptionReleased) {
            subscriptionReleased = true;
            subscriptionHeld = false;
            cleanupTasks.push(releaseSubscription(controlChannel(runId)));
        }
        if (sessionAttached) {
            sessionAttached = false;
            if (session.producer === ws) {
                clearProducerPing(session);
                session.producer = null;
                session.producerAlive = false;
                session.leaseOwner = null;
                session.leaseReady = false;
                session.leaseValidUntil = 0;
                session.leaseRenewing = false;
                session.pendingFrameMetadata = null;
                clearProducerLeaseRenewal(session);
                deleteSessionIfEmpty(runId, session);
                console.log(`[stream] Producer disconnected for run ${runId}`);
            }
        }
        if (leaseHeld && !leaseReleased) {
            leaseReleased = true;
            leaseHeld = false;
            cleanupTasks.push(releaseProducerLease(runId, owner));
        }
        await Promise.allSettled(cleanupTasks);
    };
    ws.once('close', () => {
        closed = true;
        void cleanup();
    });
    ws.once('error', () => {});

    if (closed) {
        return;
    }

    const leaseCommandStartedAt = await acquireProducerLease(runId, owner);
    if (leaseCommandStartedAt === false) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1008, 'Producer already active');
        }
        return;
    }
    leaseHeld = true;
    if (closed || ws.readyState !== WebSocket.OPEN) {
        await cleanup();
        return;
    }

    if (!sessions.has(runId) && sessions.size >= MAX_LOCAL_SESSIONS) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1013, 'Relay capacity reached');
        }
        await cleanup();
        return;
    }

    session = getSession(runId);
    session.producer = ws;
    session.producerAlive = true;
    session.leaseOwner = owner;
    session.leaseReady = true;
    session.leaseValidUntil = leaseCommandStartedAt
        + PRODUCER_LEASE_TTL_MS
        - PRODUCER_LEASE_RENEW_MS;
    sessionAttached = true;
    if (closed || ws.readyState !== WebSocket.OPEN) {
        await cleanup();
        return;
    }

    ws.on('pong', () => {
        if (session.producer === ws) {
            session.producerAlive = true;
        }
    });
    ws.on('message', (data, isBinary) => {
        if (session.producer !== ws || terminalPublish) {
            return;
        }
        if (isBinary) {
            const frame = Buffer.from(data);
            const metadata = session.pendingFrameMetadata;
            session.pendingFrameMetadata = null;
            if (frame.length === 0
                || frame.length > PRODUCER_MAX_PAYLOAD
                || framePublishPending
                || !session.leaseReady
                || !metadata) {
                return;
            }
            framePublishPending = true;
            publishOwned(runId, session, encodeFrame(metadata, frame))
                .finally(() => {
                    framePublishPending = false;
                });
            return;
        }

        const message = parseProducerMessage(data);
        if (!message) {
            return;
        }
        if (message.type === 'frame-meta') {
            session.pendingFrameMetadata = message;
            return;
        }
        const terminal = message.type === 'status' && message.status === 'ended';
        if (terminal) {
            terminalPublish = publishOwned(
                runId,
                session,
                encodeJsonEnvelope('j', message),
                true,
                CRITICAL_PUBLISH_RETRIES,
            ).then((published) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(published ? 1000 : 1013, published ? 'Run ended' : 'Terminal status unavailable');
                }
            });
            return;
        }
        void publishOwned(runId, session, encodeJsonEnvelope('j', message));
    });

    try {
        await acquireSubscription(controlChannel(runId), (raw) => handleControlEvent(runId, raw));
        subscriptionHeld = true;
    } catch {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1013, 'Relay broker unavailable');
        }
        await cleanup();
        return;
    }
    if (closed || ws.readyState !== WebSocket.OPEN || session.producer !== ws) {
        await cleanup();
        return;
    }

    console.log(`[stream] Producer connected for run ${runId}`);
    publishStatus(runId, session, 'streaming');

    session.producerPing = setInterval(() => {
        if (!session.producerAlive) {
            ws.terminate();
            return;
        }
        session.producerAlive = false;
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, PING_INTERVAL);

    session.leaseRenewal = setInterval(async () => {
        if (session.producer !== ws || session.leaseOwner !== owner || session.leaseRenewing) {
            return;
        }
        session.leaseRenewing = true;
        try {
            const renewed = await renewProducerLease(runId, session);
            if (!renewed && Date.now() >= session.leaseValidUntil) {
                ws.close(1013, 'Producer lease lost');
            }
        } finally {
            session.leaseRenewing = false;
        }
    }, PRODUCER_LEASE_RENEW_MS);
}

async function handleClientConnection(ws, runId, capability) {
    const existingSession = sessions.get(runId);
    if ((!existingSession && sessions.size >= MAX_LOCAL_SESSIONS)
        || (existingSession && existingSession.clients.size >= MAX_LOCAL_CLIENTS_PER_RUN)) {
        ws.close(1013, 'Relay capacity reached');
        return;
    }
    const session = getSession(runId);
    session.clients.add(ws);
    ws.isAlive = true;
    sendClient(ws, JSON.stringify({ type: 'status', status: 'connecting' }), false);
    let subscriptionHeld = false;
    let detached = false;
    const capabilityExpiry = scheduleCapabilityExpiry(ws, capability.expiresAt);
    let clientPing = null;
    let controlTokens = CONTROL_BURST;
    let controlLastRefill = Date.now();
    const coalescedControls = new Map();
    let controlFlushTimer = null;
    const consumeControlToken = () => {
        const now = Date.now();
        controlTokens = Math.min(
            CONTROL_BURST,
            controlTokens + ((now - controlLastRefill) / 1000) * CONTROL_RATE_PER_SECOND,
        );
        controlLastRefill = now;
        if (controlTokens < 1) {
            return false;
        }
        controlTokens -= 1;
        return true;
    };
    const flushCoalescedControls = () => {
        controlFlushTimer = null;
        if (detached || coalescedControls.size === 0) {
            return;
        }
        for (const [type, message] of coalescedControls) {
            if (!consumeControlToken()) {
                break;
            }
            coalescedControls.delete(type);
            publishControl(runId, message);
        }
        if (coalescedControls.size > 0) {
            controlFlushTimer = setTimeout(flushCoalescedControls, CONTROL_COALESCE_MS);
        }
    };
    const detach = () => {
        if (detached) {
            return;
        }
        detached = true;
        clearTimeout(capabilityExpiry);
        if (clientPing) {
            clearInterval(clientPing);
        }
        if (controlFlushTimer) {
            clearTimeout(controlFlushTimer);
        }
        coalescedControls.clear();
        if (!session.clients.delete(ws)) {
            return;
        }
        if (subscriptionHeld) {
            releaseSubscription(eventChannel(runId));
        }
        console.log(`[stream] Client left run ${runId} (${session.clients.size} local clients)`);
        deleteSessionIfEmpty(runId, session);
    };
    ws.once('close', detach);
    ws.once('error', () => {});
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    ws.on('message', (data, isBinary) => {
        if (capability.role !== 'controller') {
            ws.close(1008, 'Read-only stream capability');
            return;
        }
        const message = isBinary ? null : parseControlMessage(data);
        if (!message) {
            ws.close(1003, 'Invalid control message');
            return;
        }
        if (COALESCED_CONTROL_TYPES.has(message.type)) {
            coalescedControls.set(message.type, message);
            if (!controlFlushTimer) {
                controlFlushTimer = setTimeout(flushCoalescedControls, CONTROL_COALESCE_MS);
            }
            return;
        }
        if (!consumeControlToken()) {
            ws.close(1008, 'Control rate exceeded');
            return;
        }
        publishControl(runId, message).then((published) => {
            if (!published && ws.readyState === WebSocket.OPEN) {
                ws.close(1013, 'Control relay saturated');
            }
        });
    });

    try {
        await acquireSubscription(eventChannel(runId), (raw) => handleRunEvent(runId, raw));
        subscriptionHeld = true;
    } catch {
        session.clients.delete(ws);
        ws.close(1013, 'Relay broker unavailable');
        deleteSessionIfEmpty(runId, session);
        return;
    }
    if (detached || ws.readyState !== WebSocket.OPEN || !session.clients.has(ws)) {
        releaseSubscription(eventChannel(runId));
        subscriptionHeld = false;
        return;
    }

    console.log(`[stream] Client joined run ${runId} (${session.clients.size} local clients)`);
    publishControl(runId, { type: 'requestFrame' }, true).then((published) => {
        if (!published && ws.readyState === WebSocket.OPEN) {
            ws.close(1013, 'Control relay saturated');
        }
    });

    clientPing = setInterval(() => {
        if (!ws.isAlive) {
            ws.terminate();
            return;
        }
        if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(clientPing);
            return;
        }
        ws.isAlive = false;
        ws.ping();
    }, PING_INTERVAL);

}

function scheduleCapabilityExpiry(ws, expiresAt) {
    return setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1008, 'Stream capability expired');
        }
    }, Math.max(0, expiresAt * 1000 - Date.now()));
}

function handleRunEvent(runId, raw) {
    const session = sessions.get(runId);
    if (!session || session.clients.size === 0) {
        return;
    }

    const framePair = decodeFrame(raw);
    if (framePair) {
        const metadata = JSON.stringify(framePair.metadata);
        for (const client of session.clients) {
            sendFramePair(client, metadata, framePair.frame);
        }
        return;
    }

    const message = decodeJsonEnvelope(raw, 'j', isProducerMessage);
    if (!message) {
        return;
    }
    const data = JSON.stringify(message);
    for (const client of session.clients) {
        sendClient(client, data, false);
    }
}

function handleControlEvent(runId, raw) {
    const session = sessions.get(runId);
    const producer = session?.producer;
    if (!producer
        || producer.readyState !== WebSocket.OPEN
        || !session.leaseReady
        || session.leaseValidUntil <= Date.now()) {
        return;
    }
    const message = decodeJsonEnvelope(raw, 'c', isControlMessage);
    if (message) {
        sendClient(producer, JSON.stringify(message), false);
    }
}

function sendClient(ws, data, binary) {
    if (ws.readyState !== WebSocket.OPEN) {
        return false;
    }
    const payloadBytes = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    if (payloadBytes > MAX_SOCKET_BUFFERED_BYTES
        || ws.bufferedAmount + payloadBytes > MAX_SOCKET_BUFFERED_BYTES) {
        if (!binary) {
            ws.close(1013, 'Slow stream consumer');
        }
        return false;
    }
    try {
        ws.send(data, { binary });
        return true;
    } catch {
        return false;
    }
}

function sendFramePair(ws, metadata, frame) {
    if (ws.readyState !== WebSocket.OPEN) {
        return false;
    }
    const metadataBytes = Buffer.byteLength(metadata);
    const pairBytes = metadataBytes + frame.length;
    if (pairBytes > MAX_SOCKET_BUFFERED_BYTES
        || ws.bufferedAmount + pairBytes > MAX_SOCKET_BUFFERED_BYTES) {
        return false;
    }
    try {
        ws.send(metadata, { binary: false });
        ws.send(frame, { binary: true });
        return true;
    } catch {
        return false;
    }
}

function parseProducerMessage(data) {
    if (data.length > CLIENT_MAX_PAYLOAD) {
        return null;
    }
    try {
        const message = JSON.parse(data.toString('utf8'));
        return isProducerMessage(message) ? message : null;
    } catch {
        return null;
    }
}

function isProducerMessage(message) {
    if (!isPlainObject(message) || typeof message.type !== 'string') {
        return false;
    }
    if (message.type === 'frame-meta') {
        return isPlainObject(message.metadata)
            && (message.sessionId === undefined
                || typeof message.sessionId === 'string'
                || Number.isFinite(message.sessionId))
            && (message.tabName === undefined || isTabName(message.tabName));
    }
    if (message.type === 'url') {
        return typeof message.url === 'string'
            && message.url.length <= 8192
            && (message.tabName === undefined || isTabName(message.tabName));
    }
    if (message.type === 'tabs') {
        return Array.isArray(message.tabs)
            && message.tabs.length <= 64
            && message.tabs.every(isTabName)
            && new Set(message.tabs).size === message.tabs.length
            && (message.tabs.length === 0
                ? message.activeTabName === null
                : isTabName(message.activeTabName) && message.tabs.includes(message.activeTabName));
    }
    if (message.type === 'clipboard') {
        return typeof message.text === 'string'
            && Buffer.byteLength(message.text) <= CLIENT_MAX_PAYLOAD
            && ['copy', 'cut'].includes(message.action);
    }
    if (message.type === 'status') {
        return STATUS_VALUES.has(message.status);
    }
    return false;
}

function parseControlMessage(data) {
    if (data.length > CLIENT_MAX_PAYLOAD) {
        return null;
    }
    try {
        const message = JSON.parse(data.toString('utf8'));
        return isControlMessage(message) ? message : null;
    } catch {
        return null;
    }
}

function isControlMessage(message) {
    if (!isPlainObject(message) || !CONTROL_TYPES.has(message.type)) {
        return false;
    }
    if (['mousemove', 'mousedown', 'mouseup', 'wheel'].includes(message.type)
        && (!isCoordinate(message.x) || !isCoordinate(message.y))) {
        return false;
    }
    if (message.type === 'wheel'
        && (!isCoordinate(message.deltaX || 0) || !isCoordinate(message.deltaY || 0))) {
        return false;
    }
    if (['keydown', 'keyup'].includes(message.type)
        && (!isShortString(message.key) || !isShortString(message.code))) {
        return false;
    }
    if (message.type === 'paste') {
        return typeof message.text === 'string' && Buffer.byteLength(message.text) <= CLIENT_MAX_PAYLOAD;
    }
    if (message.type === 'navigate') {
        return typeof message.url === 'string' && message.url.length > 0 && message.url.length <= 8192;
    }
    if (message.type === 'switchTab') {
        return isTabName(message.tabName);
    }
    return optionalInteger(message.modifiers)
        && optionalInteger(message.buttons)
        && optionalInteger(message.clickCount)
        && optionalInteger(message.keyCode)
        && (message.text === undefined || (typeof message.text === 'string' && message.text.length <= 8))
        && (message.button === undefined
            || ['none', 'left', 'middle', 'right', 'back', 'forward'].includes(message.button));
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCoordinate(value) {
    return Number.isFinite(value) && Math.abs(value) <= 10000000;
}

function isShortString(value) {
    return typeof value === 'string' && value.length <= 128;
}

function isTabName(value) {
    return typeof value === 'string'
        && value.length > 0
        && value.length <= 128
        && value.trim() === value
        && !Array.from(value)
            .some(character => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127);
}

function optionalInteger(value) {
    return value === undefined || (Number.isSafeInteger(value) && Math.abs(value) <= 10000000);
}

function publishStatus(runId, session, status) {
    return publishOwned(
        runId,
        session,
        encodeJsonEnvelope('j', { type: 'status', status }),
        true,
        CRITICAL_PUBLISH_RETRIES,
    );
}

function publishControl(runId, message, critical = false) {
    return publish(controlChannel(runId), encodeJsonEnvelope('c', message), critical, true);
}

function clearProducerPing(session) {
    if (session.producerPing) {
        clearInterval(session.producerPing);
        session.producerPing = null;
    }
}

function clearProducerLeaseRenewal(session) {
    if (session.leaseRenewal) {
        clearInterval(session.leaseRenewal);
        session.leaseRenewal = null;
    }
}

function deleteSessionIfEmpty(runId, session) {
    if (!session.producer && session.clients.size === 0 && sessions.get(runId) === session) {
        sessions.delete(runId);
    }
}

async function resynchronizeRuns() {
    if (!isBrokerReady()) {
        return;
    }
    for (const [runId, session] of sessions) {
        if (session.producer?.readyState === WebSocket.OPEN) {
            if (!await renewProducerLease(runId, session)) {
                session.producer.close(1013, 'Producer lease lost');
                continue;
            }
            publishStatus(runId, session, 'streaming');
        }
        if (session.clients.size > 0) {
            publishControl(runId, { type: 'requestFrame' }, true);
        }
    }
}

function closeActiveRelaySockets() {
    console.error('[stream] Redis relay unavailable, closing active streams');
    for (const session of sessions.values()) {
        if (session.producer?.readyState === WebSocket.OPEN) {
            session.producer.close(1013, 'Relay broker unavailable');
        }
        for (const client of session.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.close(1013, 'Relay broker unavailable');
            }
        }
    }
}

async function shutdown() {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    console.log('[stream] Shutting down');
    if (brokerOutageTimer) {
        clearTimeout(brokerOutageTimer);
    }
    const serverClosed = new Promise((resolve) => {
        if (!server.listening) {
            resolve();
            return;
        }
        server.close(resolve);
    });
    const leaseReleases = [];
    for (const [runId, session] of sessions) {
        clearProducerPing(session);
        clearProducerLeaseRenewal(session);
        if (session.leaseOwner) {
            session.leaseReady = false;
            leaseReleases.push(releaseProducerLease(runId, session.leaseOwner));
        }
        if (session.producer?.readyState === WebSocket.OPEN) {
            session.producer.close(1001, 'Relay shutting down');
        }
        for (const client of session.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.close(1001, 'Relay shutting down');
            }
        }
    }

    const cleanup = Promise.allSettled([
        ...leaseReleases,
        subscriber.isReady ? subscriber.unsubscribe() : Promise.resolve(),
    ]);
    let deadlineTimer;
    await Promise.race([
        Promise.allSettled([serverClosed, cleanup]),
        new Promise((resolve) => {
            deadlineTimer = setTimeout(resolve, SHUTDOWN_GRACE_MS);
        }),
    ]);
    clearTimeout(deadlineTimer);

    for (const ws of [...producerWss.clients, ...clientWss.clients]) {
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.terminate();
        }
    }
    await Promise.race([
        serverClosed,
        new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    const redisClosed = Promise.allSettled([
        publisher.isOpen ? publisher.close() : Promise.resolve(),
        subscriber.isOpen ? subscriber.close() : Promise.resolve(),
    ]);
    await Promise.race([
        redisClosed,
        new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    if (publisher.isOpen) {
        publisher.destroy();
    }
    if (subscriber.isOpen) {
        subscriber.destroy();
    }
    process.exitCode = 0;
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[stream] Browser stream relay on port ${PORT}`);
});

Promise.all([publisher.connect(), subscriber.connect()]).catch(() => {
    console.error('[stream] Redis initial connection failed');
});
