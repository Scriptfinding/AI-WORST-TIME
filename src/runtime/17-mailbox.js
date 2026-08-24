// ================================
// MAILBOX WATCHERS
// ================================

const __pendingMailboxClaims = new Map();
const __mailboxClaimsPath = process.env.RUN_MAILBOX_CLAIMS_PATH || '';

const __forgetPendingMailboxClaim = function(pending) {
  if (pending.renewTimer) clearInterval(pending.renewTimer);
  __pendingMailboxClaims.delete(pending.id);
};

const __persistPendingMailboxClaim = function(pending) {
  if (!__mailboxClaimsPath) {
    throw new Error('Mailbox claim persistence is not available for this run.');
  }
  fs.appendFileSync(
    __mailboxClaimsPath,
    JSON.stringify({ message_id: pending.id, claim_token: pending.claimToken }) + '\n',
    { encoding: 'utf8', mode: 0o600 },
  );
  fs.chmodSync(__mailboxClaimsPath, 0o600);
};

const __renewPendingMailboxClaim = async function(pending) {
  if (pending.renewing || !__pendingMailboxClaims.has(pending.id)) return;
  pending.renewing = true;
  try {
    const response = await __runnerOperations.mailboxRenew({
      message_id: pending.id,
      claim_token: pending.claimToken,
    });
    if (!response.ok) return;
    const renewed = await response.json();
    const renewedDeadline = Date.parse(renewed.lease_expires_at);
    if (Number.isFinite(renewedDeadline)) pending.leaseDeadline = renewedDeadline;
  } catch (_) {
    // A later renewal or the final ACK can still succeed within the current lease.
  } finally {
    pending.renewing = false;
  }
};

const __trackPendingMailboxClaim = function(claim, leaseDeadline) {
  const pending = {
    id: claim.id,
    claimToken: claim.claim_token,
    leaseDeadline,
    renewing: false,
    renewTimer: null,
  };
  const interval = Math.max(1000, Math.min(10000, Math.floor((leaseDeadline - Date.now()) / 3)));
  pending.renewTimer = setInterval(() => {
    void __renewPendingMailboxClaim(pending);
  }, interval);
  if (typeof pending.renewTimer.unref === 'function') pending.renewTimer.unref();
  __pendingMailboxClaims.set(pending.id, pending);
  try {
    __persistPendingMailboxClaim(pending);
  } catch (error) {
    __forgetPendingMailboxClaim(pending);
    throw error;
  }
};

/* @help Mailbox
 * @sig $waitForEmail(mailboxWatcherId, options?)
 * @desc Wait for an email matching the named mailbox watcher's rules. Returns email metadata and optional parsed value. Timeout priority: options > watcher config > 300s default.
 * @nodal-desc Wait until a configured mailbox watcher receives a matching email.
 * @nodal-output object from:string, to:string, subject:string, date:string, received_at:string, text:string, html:string, parsed:unknown, body:string, parsed_value:unknown, sender_authentication:string
 * @opt timeout: (watcher config or 300000)
 * @nodal-param mailboxWatcherId [mailbox-watcher]: Mailbox watcher ID to wait on.
 * @nodal-param options: Email wait options.
 * @nodal-param options.timeout [number]: Maximum time to wait for the email, in milliseconds.
 */
const $waitForEmail = async function(mailboxWatcherId, options = {}) {
  __emitAction('waitEmail', mailboxWatcherId);
  if (!Object.prototype.hasOwnProperty.call($_watchers, mailboxWatcherId)) {
    const available = Object.keys($_watchers)
      .map(id => ($_watchers[id].name ? $_watchers[id].name + ' (' + id + ')' : id))
      .join(', ');
    throw new Error('Mailbox watcher "' + mailboxWatcherId + '" is not authorized for this run. Available: ' + available);
  }
  const _watcherCfg = $_watchers[mailboxWatcherId];
  const _defaultTimeout = _watcherCfg.timeout || 300000;
  const opts = { timeout: _defaultTimeout, ...options };
  const end = Date.now() + opts.timeout;

  if (!__runnerOperations.available) {
    throw new Error('Mailbox API is not available for this run.');
  }

  console.debug('Waiting for email on watcher "' + mailboxWatcherId + '" (timeout: ' + (opts.timeout / 1000) + 's)...');

  while (Date.now() < end) {
    let response;
    try {
      response = await __runnerOperations.mailboxClaim({ watcher: mailboxWatcherId });
    } catch (_) {
      await __internalSleep(2000);
      continue;
    }

    if (response.status === 401 || response.status === 409) {
      throw new Error('Mailbox queue is no longer active for this run.');
    }
    if (response.status === 204) {
      await __internalSleep(2000);
      continue;
    }
    if (!response.ok) {
      await __internalSleep(2000);
      continue;
    }

    let claim;
    try {
      claim = await response.json();
    } catch (_) {
      await __internalSleep(2000);
      continue;
    }
    if (
      !claim ||
      !Number.isInteger(claim.id) ||
      typeof claim.claim_token !== 'string' ||
      !claim.email ||
      typeof claim.email !== 'object'
    ) {
      await __internalSleep(2000);
      continue;
    }

    const leaseDeadline = Date.parse(claim.lease_expires_at);
    if (!Number.isFinite(leaseDeadline) || leaseDeadline <= Date.now()) {
      await __internalSleep(2000);
      continue;
    }
    __trackPendingMailboxClaim(claim, leaseDeadline);
    console.log('Email received on watcher "' + mailboxWatcherId + '".');
    return claim.email;
  }

  __emitAction('timeout', mailboxWatcherId);
  throw new Error('Timeout waiting for email on watcher "' + mailboxWatcherId + '"');
};

