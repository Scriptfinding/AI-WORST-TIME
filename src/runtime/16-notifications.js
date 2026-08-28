// ================================
// NOTIFICATION CHANNELS
// ================================

const $_watchers = JSON.parse(__watchersJson);

const $_sendNotification = (() => {
  const channels = JSON.parse(__channelsJson);
  const sendRequest = globalThis.fetch.bind(globalThis);
  const available = () => channels
    .map(channel => (channel.name ? channel.name + ' (' + channel.id + ')' : channel.id))
    .join(', ');
  const redact = (value, secret) => secret
    ? String(value).split(secret).join('[REDACTED]')
    : String(value);
  const request = async (url, options, token) => {
    try {
      return await sendRequest(url, options);
    } catch (error) {
      throw new Error(redact(error && error.message ? error.message : error, token));
    }
  };

  return async function(channelId, message, options = {}) {
    const channel = channels.find(candidate => candidate.id === channelId);
    if (!channel) throw new Error('Notification channel "' + channelId + '" not found. Available: ' + available());

    const defaultOptions = {
      link: null,
      showFlowId: false,
      showRunId: false,
    };
    const opts = { ...defaultOptions, ...(options || {}) };
    const { provider, token, chat_id } = channel;
    const { link, showFlowId, showRunId } = opts;

    const tags = [];
    if (showFlowId && $json.$context.flow_id) tags.push($json.$context.flow_id);
    if (showRunId && $json.$context.run_id) tags.push('Run #' + $json.$context.run_id);
    if (tags.length) {
      const prefix = tags.join(' - ');
      if (provider === 'telegram') {
        message = '<b>' + prefix + '</b>\n' + message;
      } else if (provider === 'discord') {
        message = '**' + prefix + '**\n' + message;
      } else if (provider === 'slack') {
        message = '*' + prefix + '*\n' + message;
      } else {
        message = prefix + '\n' + message;
      }
    }

    if (provider === 'telegram') {
      const isValidUrl = link && /^https:\/\//.test(link.url);
      const text = isValidUrl ? message : (link ? message + '\n\n' + link.label + ': ' + link.url : message);
      const body = { chat_id: chat_id, text: text, parse_mode: 'HTML' };
      if (isValidUrl) {
        body.reply_markup = { inline_keyboard: [[{ text: link.label, url: link.url }]] };
      }
      const resp = await request('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, token);
      if (!resp.ok) throw new Error('Telegram: ' + redact(await resp.text(), token));
    } else if (provider === 'discord') {
      const body = { content: message };
      if (link) {
        body.components = [{ type: 1, components: [{ type: 2, style: 5, label: link.label, url: link.url }] }];
      }
      const resp = await request('https://discord.com/api/v10/channels/' + chat_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bot ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, token);
      if (!resp.ok) throw new Error('Discord: ' + redact(await resp.text(), token));
    } else if (provider === 'slack') {
      const body = { channel: chat_id, text: message };
      if (link) {
        body.blocks = [
          { type: 'section', text: { type: 'mrkdwn', text: message } },
          { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: link.label }, url: link.url }] }
        ];
      }
      const resp = await request('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, token);
      if (!resp.ok) throw new Error('Slack: ' + redact(await resp.text(), token));
      const data = await resp.json();
      if (!data.ok) throw new Error('Slack: ' + data.error);
    }

    return provider;
  };
})();

/* @help Notification
 * @sig $notify(channelId, notificationMessage, options?)
 * @desc Send a notification via a configured channel (Slack, Discord, Telegram).
 * @nodal-desc Send a message to a configured notification channel.
 * @nodal-param channelId [channel]: Notification channel ID.
 * @nodal-param notificationMessage: Message to send to the channel.
 * @nodal-param options: Notification display options.
 * @nodal-param options.showFlowId [boolean]: Show the current flow ID in the notification.
 * @nodal-param options.showRunId [boolean]: Show the current run identifier in the notification.
 * @nodal-param options.link [custom-object]: Link displayed in the notification, such as url and label.
 */
const $notify = async function(channelId, notificationMessage, options = {}) {
  __emitAction('notify', channelId + (notificationMessage ? ': ' + String(notificationMessage).slice(0, 60) : ''));
  const provider = await $_sendNotification(channelId, notificationMessage, options);
  console.debug('Notified ' + channelId + ' (' + provider + ')');
  console.debug('Successfully sent notification to ' + channelId);
};

/* @help Notification
 * @sig $waitHumanValidation(channelId?, validationMessage?, options?)
 * @desc Pause the run until a human clicks "Continue run". Optionally sends a notification if channelId and validationMessage are provided.
 * @nodal-desc Pause the run until someone approves it in Puppetflow.
 * @nodal-param channelId [channel]: Optional notification channel ID.
 * @nodal-param validationMessage: Message sent with the human validation request.
 * @nodal-param options: Notification display options.
 * @nodal-param options.showFlowId [boolean]: Show the current flow ID in the notification.
 * @nodal-param options.showRunId [boolean]: Show the current run identifier in the notification.
 * @nodal-param options.link [custom-object]: Link displayed in the notification, such as url and label.
 */
const $waitHumanValidation = async function(channelId, validationMessage, options = {}) {
  __emitAction('waitHuman', validationMessage ? String(validationMessage).slice(0, 60) : (channelId || ''));
  const runUrl = $_appUrl + '/flows/' + ($json.$context.flow_id || '') + '?run=' + ($json.$context.run_id || '') + '#runs';
  const waitId = crypto.randomUUID();
  let declared = false;
  let consumed = false;
  let lastConnectionErrorLogAt = 0;
  const isRetryableFailure = response => response.status === 429 || response.status >= 500;
  const logConnectionError = (operation, error) => {
    const now = Date.now();
    if (now - lastConnectionErrorLogAt < 10000) return;
    lastConnectionErrorLogAt = now;
    const detail = error instanceof Error ? error.message : String(error);
    console.debug('Human validation ' + operation + ' connection failed, retrying: ' + detail);
  };
  const permanentFailure = async (response, operation) => {
    let detail = '';
    try {
      const body = await response.text();
      if (body) {
        try {
          const payload = JSON.parse(body);
          detail = payload.message || payload.error || body;
        } catch (_) {
          detail = body;
        }
      }
    } catch (_) {}

    const suffix = detail ? ': ' + String(detail).slice(0, 300) : '';
    return new Error('Runtime human validation ' + operation + ' failed (HTTP ' + response.status + ')' + suffix);
  };

  try {
    while (!declared) {
      let response;
      try {
        response = await __runnerOperations.waitingDeclare({
          wait_id: waitId,
          validation_message: validationMessage == null ? null : String(validationMessage).slice(0, 10000),
        });
      } catch (error) {
        logConnectionError('declaration', error);
        await __internalSleep(2000);
        continue;
      }
      if (!response.ok) {
        if (isRetryableFailure(response)) {
          await __internalSleep(2000);
          continue;
        }
        throw await permanentFailure(response, 'declaration');
      }
      declared = true;
    }

    if (channelId) {
      const mergedOptions = {
        showFlowId: true,
        showRunId: true,
        link: { url: runUrl, label: '👋 Manage run' },
        ...options,
      };

      console.debug('Sending human validation request to ' + channelId);
      await $_sendNotification(channelId, validationMessage || 'Human validation required', mergedOptions);
    }

    console.debug('Waiting for human validation... (Continue from the Puppetflow UI)');
    while (!consumed) {
      let response;
      try {
        response = await __runnerOperations.waitingConsume({ wait_id: waitId });
      } catch (error) {
        logConnectionError('continuation', error);
        await __internalSleep(2000);
        continue;
      }
      if (response.status === 204) {
        await __internalSleep(3000);
        continue;
      }
      if (!response.ok) {
        if (isRetryableFailure(response)) {
          await __internalSleep(2000);
          continue;
        }
        throw await permanentFailure(response, 'continuation');
      }
      consumed = true;
    }

    console.log('[WAIT] Human validation received. Continuing run.');
  } finally {
    if (declared && !consumed) {
      try {
        await __runnerOperations.waitingClear({ wait_id: waitId });
      } catch (_) {}
    }
  }
};

