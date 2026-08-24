const { config: loadDotenv } = require('dotenv');
const { z } = require('zod');

loadDotenv({ quiet: true });

const positiveInteger = z.coerce.number().int().positive();
const optionalString = z.preprocess(
    (value) => (value === '' || value === 'null' ? undefined : value),
    z.string().optional(),
);

const schema = z.object({
    BROWSER_STREAM_INTERNAL_PORT: positiveInteger.default(6080),
    BROWSER_STREAM_SECRET: z.string().min(32),
    BROWSER_STREAM_ALLOWED_ORIGINS: z.string().default(
        '~^https://([a-zA-Z0-9-]+\\.)*puppetflow\\.com$~,~^https?://localhost(?::[0-9]+)?$~,~^https?://127\\.0\\.0\\.1(?::[0-9]+)?$~,~^https?://\\[::1\\](?::[0-9]+)?$~',
    ),
    BROWSER_STREAM_MAX_TOKEN_TTL: positiveInteger.default(300),
    BROWSER_STREAM_PRODUCER_TOKEN_TTL: positiveInteger.default(300),
    BROWSER_STREAM_PRODUCER_MAX_TOKEN_TTL: positiveInteger.default(10000029),
    BROWSER_STREAM_REDIS_NAMESPACE: z.string()
        .regex(/^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$/)
        .default('puppetflow:stream'),
    BROWSER_STREAM_BROKER_OUTAGE_GRACE_MS: positiveInteger.default(5000),
    BROWSER_STREAM_MAX_BUFFERED_BYTES: positiveInteger.default(2 * 1024 * 1024),
    BROWSER_STREAM_PRODUCER_LEASE_TTL_MS: positiveInteger.default(15000),
    BROWSER_STREAM_PRODUCER_LEASE_RENEW_MS: positiveInteger.default(5000),
    BROWSER_STREAM_MAX_LOCAL_SESSIONS: positiveInteger.optional(),
    BROWSER_STREAM_MAX_SESSIONS: positiveInteger.optional(),
    BROWSER_STREAM_MAX_LOCAL_CLIENTS_PER_RUN: positiveInteger.optional(),
    BROWSER_STREAM_MAX_CLIENTS_PER_RUN: positiveInteger.optional(),
    BROWSER_STREAM_CONTROL_RATE_PER_SECOND: positiveInteger.default(120),
    BROWSER_STREAM_CONTROL_BURST: positiveInteger.default(240),
    BROWSER_STREAM_CONTROL_COALESCE_MS: positiveInteger.default(16),
    BROWSER_STREAM_MAX_PENDING_PUBLISHES: positiveInteger.default(256),
    BROWSER_STREAM_MAX_PENDING_CRITICAL_PUBLISHES: positiveInteger.default(16),
    BROWSER_STREAM_REDIS_COMMAND_TIMEOUT_MS: positiveInteger.default(3000),
    BROWSER_STREAM_SHUTDOWN_GRACE_MS: positiveInteger.default(10000),
    REDIS_URL: optionalString,
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: positiveInteger.default(6379),
    REDIS_USERNAME: optionalString,
    REDIS_PASSWORD: optionalString,
});

const result = schema.safeParse(process.env);
if (!result.success) {
    const details = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
    throw new Error(`Invalid stream server configuration: ${details}`);
}

const env = result.data;
const redisUrl = new URL(env.REDIS_URL || 'redis://localhost');
if (!env.REDIS_URL) {
    redisUrl.hostname = env.REDIS_HOST;
    redisUrl.port = String(env.REDIS_PORT);
    redisUrl.username = env.REDIS_USERNAME || '';
    redisUrl.password = env.REDIS_PASSWORD || '';
}

if (env.BROWSER_STREAM_PRODUCER_TOKEN_TTL > env.BROWSER_STREAM_PRODUCER_MAX_TOKEN_TTL) {
    throw new Error(
        'BROWSER_STREAM_PRODUCER_TOKEN_TTL cannot exceed BROWSER_STREAM_PRODUCER_MAX_TOKEN_TTL',
    );
}
if (
    env.BROWSER_STREAM_PRODUCER_LEASE_RENEW_MS * 2 >= env.BROWSER_STREAM_PRODUCER_LEASE_TTL_MS
    || env.BROWSER_STREAM_PRODUCER_LEASE_TTL_MS
        <= env.BROWSER_STREAM_BROKER_OUTAGE_GRACE_MS + env.BROWSER_STREAM_PRODUCER_LEASE_RENEW_MS
) {
    throw new Error('Producer lease timing must exceed renewal and broker outage grace');
}

module.exports = {
    PORT: env.BROWSER_STREAM_INTERNAL_PORT,
    STREAM_SECRET: env.BROWSER_STREAM_SECRET,
    MAX_TOKEN_TTL: env.BROWSER_STREAM_MAX_TOKEN_TTL,
    PRODUCER_MAX_TOKEN_TTL: env.BROWSER_STREAM_PRODUCER_MAX_TOKEN_TTL,
    REDIS_URL: redisUrl.toString(),
    REDIS_NAMESPACE: env.BROWSER_STREAM_REDIS_NAMESPACE,
    ALLOWED_ORIGINS: env.BROWSER_STREAM_ALLOWED_ORIGINS,
    BROKER_OUTAGE_GRACE_MS: env.BROWSER_STREAM_BROKER_OUTAGE_GRACE_MS,
    MAX_SOCKET_BUFFERED_BYTES: env.BROWSER_STREAM_MAX_BUFFERED_BYTES,
    PRODUCER_LEASE_TTL_MS: env.BROWSER_STREAM_PRODUCER_LEASE_TTL_MS,
    PRODUCER_LEASE_RENEW_MS: env.BROWSER_STREAM_PRODUCER_LEASE_RENEW_MS,
    MAX_LOCAL_SESSIONS: env.BROWSER_STREAM_MAX_LOCAL_SESSIONS
        || env.BROWSER_STREAM_MAX_SESSIONS
        || 1000,
    MAX_LOCAL_CLIENTS_PER_RUN: env.BROWSER_STREAM_MAX_LOCAL_CLIENTS_PER_RUN
        || env.BROWSER_STREAM_MAX_CLIENTS_PER_RUN
        || 20,
    CONTROL_RATE_PER_SECOND: env.BROWSER_STREAM_CONTROL_RATE_PER_SECOND,
    CONTROL_BURST: env.BROWSER_STREAM_CONTROL_BURST,
    CONTROL_COALESCE_MS: env.BROWSER_STREAM_CONTROL_COALESCE_MS,
    MAX_PENDING_PUBLISHES: env.BROWSER_STREAM_MAX_PENDING_PUBLISHES,
    MAX_PENDING_CRITICAL_PUBLISHES: env.BROWSER_STREAM_MAX_PENDING_CRITICAL_PUBLISHES,
    REDIS_COMMAND_TIMEOUT_MS: env.BROWSER_STREAM_REDIS_COMMAND_TIMEOUT_MS,
    SHUTDOWN_GRACE_MS: env.BROWSER_STREAM_SHUTDOWN_GRACE_MS,
};
