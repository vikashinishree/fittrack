// Mirrors server/utils/password.js — the server is the real enforcer.
export const rules = ({ password = '', email = '', name = '' }) => {
  const local = email.split('@')[0].toLowerCase();
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  const pw = password.toLowerCase();
  return [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One number', ok: /\d/.test(password) },
    { label: 'One special character (! @ # $ …)', ok: /[^A-Za-z0-9]/.test(password) },
    { label: "Doesn't contain your name or email", ok: !(local.length >= 3 && pw.includes(local)) && !(first.length >= 3 && pw.includes(first)) },
  ];
};
export const allPassed = checks => checks.every(c => c.ok);
