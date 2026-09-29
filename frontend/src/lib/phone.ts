/** Sri Lankan mobile numbers. Stored as +947XXXXXXXX. */

export function parseLkMobile(raw: string): string | null {
  let n = raw.replace(/\D/g, '');
  if (n.startsWith('94')) n = n.slice(2);
  if (n.startsWith('0')) n = n.slice(1);
  if (!/^7\d{8}$/.test(n)) return null;
  return `+94${n}`;
}

export function formatLkMobileInput(raw: string): string {
  let n = raw.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = '+' + n.slice(1).replace(/\D/g, '');
  else n = n.replace(/\D/g, '');
  if (n.startsWith('+94')) n = n.slice(0, 12);
  else if (n.startsWith('94')) n = n.slice(0, 11);
  else n = n.slice(0, 10);
  return n;
}

export function displayLkMobile(e164: string): string {
  const parsed = parseLkMobile(e164);
  if (!parsed) return e164;
  const rest = parsed.slice(3); // 7XXXXXXXX
  return `+94 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
}
