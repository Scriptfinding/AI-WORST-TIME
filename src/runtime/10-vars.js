// Runtime variable resolution
const __recordRuntimeSecret = function(value) {
  if (!__runtimeSecretsPath || value === undefined || value === null) return;
  let secret;
  if (typeof value === 'string') {
    secret = value;
  } else {
    try {
      secret = JSON.stringify(value);
    } catch (_) {
      secret = String(value);
    }
  }
  if (!secret) return;
  fs.appendFileSync(__runtimeSecretsPath, JSON.stringify(secret) + '\n', { encoding: 'utf8', mode: 0o600 });
};

/* @help Utility
 * @sig $vars(variableId)
 * @desc Resolve a variable at runtime by its ID. For TOTP vault variables, computes a fresh code on every call.
 * @nodal-output unknown
 * @nodal-param variableId: Variable ID to resolve at runtime.
 */
const $vars = (() => {
  const entries = JSON.parse(__varsJson);
  const createHmac = require('crypto').createHmac;

  function base32Decode(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    input = input.toUpperCase().replace(/=+$/, '');
    let buffer = 0, bitsLeft = 0;
    const output = [];
    for (let i = 0; i < input.length; i++) {
      const val = alphabet.indexOf(input[i]);
      if (val === -1) return null;
      buffer = (buffer << 5) | val;
      bitsLeft += 5;
      if (bitsLeft >= 8) {
        bitsLeft -= 8;
        output.push((buffer >> bitsLeft) & 0xff);
      }
    }
    return Buffer.from(output);
  }

  function computeTotp(otpauthUri) {
    const url = new URL(otpauthUri);
    const secrets = url.searchParams.getAll('secret');
    const periods = url.searchParams.getAll('period');
    const digitCounts = url.searchParams.getAll('digits');
    const algorithms = url.searchParams.getAll('algorithm');
    if (secrets.length !== 1 || periods.length > 1 || digitCounts.length > 1 || algorithms.length > 1) {
      return null;
    }
    const secret = secrets[0].replace(/\s+/g, '').toUpperCase();
    if (!secret) return null;

    const positiveInteger = (value, fallback, maximum) => {
      if (value === null || !/^[1-9]\d*$/.test(value)) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(parsed, maximum) : maximum;
    };
    const digits = positiveInteger(digitCounts[0] || null, 6, 10);
    const period = positiveInteger(periods[0] || null, 30, Number.MAX_SAFE_INTEGER);
    const algorithm = (algorithms[0] || 'sha1').toLowerCase();

    const key = base32Decode(secret);
    if (!key || key.length === 0) return null;

    const counter = Math.floor(Date.now() / 1000 / period);
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter >>> 0, 4);

    const alg = algorithm === 'sha256' ? 'sha256' : algorithm === 'sha512' ? 'sha512' : 'sha1';
    const hmac = createHmac(alg, key).update(buf).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, digits);

    return String(code).padStart(digits, '0');
  }

  return function(variableId) {
    const parts = String(variableId).split('.');
    const baseId = parts.shift();
    const entry = entries[baseId];
    if (!entry) {
      const available = Object.keys(entries)
        .map(id => (entries[id].label ? entries[id].label + ' (' + id + ')' : id))
        .join(', ');
      throw new Error('Variable "' + variableId + '" not found. Available: ' + available);
    }
    let value;
    if (entry.vault_field_type === 'OTP' && entry.value && entry.value.startsWith('otpauth://')) {
      value = computeTotp(entry.value);
      if (!value) throw new Error('Failed to compute TOTP for variable "' + variableId + '"');
    } else {
      value = entry.value;
    }
    if (parts.length > 0) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          throw new Error('Variable "' + baseId + '" does not contain JSON data');
        }
      }
      for (const part of parts) {
        if (value === null || typeof value !== 'object' || !(part in value)) {
          throw new Error('Variable path "' + variableId + '" not found');
        }
        value = value[part];
      }
    }
    __recordRuntimeSecret(value);
    return value;
  };
})();

