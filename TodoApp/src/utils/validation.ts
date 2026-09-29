const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REAL_DOMAIN_MESSAGE = 'Please use an email address from a real domain';

// Each function returns an error message, or null if everything is fine.
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email';
  return null;
}

type DnsJson = { Status?: number; Answer?: { type?: number }[] };

// The hosted API only checks the shape of the address, so the app asks
// Cloudflare whether the domain has mail servers before login or register.
export async function validateEmailDomain(email: string): Promise<string | null> {
  const formatError = validateEmail(email);
  if (formatError) return formatError;

  const domain = email.trim().toLowerCase().split('@')[1];
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } },
    );
    if (!res.ok) return 'Could not verify this email domain. Please try again.';

    const data = (await res.json()) as DnsJson;
    // 3 = NXDOMAIN, the domain does not exist. 15 = MX record.
    if (data.Status === 3) return REAL_DOMAIN_MESSAGE;
    const hasMailServer = (data.Answer ?? []).some((record) => record.type === 15);
    if (!hasMailServer) return REAL_DOMAIN_MESSAGE;
    return null;
  } catch {
    return 'Could not verify this email domain. Please try again.';
  }
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}
