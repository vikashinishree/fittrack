// Single source of truth for password rules (server side).
// Keep the client checklist in client/src/passwordRules.js in sync.
export const MIN_LENGTH = 8;
export const MAX_LENGTH = 72; // bcrypt ignores everything after 72 bytes

export function checkPassword(pw = '', { email = '', name = '' } = {}) {
  const errors = [];
  if (typeof pw !== 'string') return ['Password must be text'];
  if (pw.length < MIN_LENGTH) errors.push(`at least ${MIN_LENGTH} characters`);
  if (Buffer.byteLength(pw) > MAX_LENGTH) errors.push(`no more than ${MAX_LENGTH} characters`);
  if (!/[a-z]/.test(pw)) errors.push('a lowercase letter');
  if (!/[A-Z]/.test(pw)) errors.push('an uppercase letter');
  if (!/\d/.test(pw)) errors.push('a number');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('a special character (e.g. ! @ # $)');
  const local = email.split('@')[0].toLowerCase();
  if (local.length >= 3 && pw.toLowerCase().includes(local)) errors.push('must not contain your email name');
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  if (first.length >= 3 && pw.toLowerCase().includes(first)) errors.push('must not contain your name');
  return errors;
}
