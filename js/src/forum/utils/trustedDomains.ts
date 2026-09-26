export type TrustedDomainRule = { type: 'exact' | 'subdomain'; hostname: string };

function normalizeHostname(hostname: string): string | null {
  // A rule is a hostname, never a URL, port, credential, or encoded separator.
  if (!hostname || /[\s/:?#@\\*%]/u.test(hostname)) return null;

  try {
    const normalized = new URL(`https://${hostname}`).hostname.toLowerCase().replace(/\.$/, '');
    if (
      !normalized ||
      normalized.split('.').some((label) => !label || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))
    ) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function parseTrustedDomains(raw: string): TrustedDomainRule[] {
  const rules: TrustedDomainRule[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const rule = line.trim();
    const subdomain = rule.startsWith('*.');
    const hostname = normalizeHostname(subdomain ? rule.slice(2) : rule);
    if (hostname) rules.push({ type: subdomain ? 'subdomain' : 'exact', hostname });
  }

  return rules;
}

export function isTrustedHostname(hostname: string, rules: readonly TrustedDomainRule[]): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return false;

  return rules.some((rule) =>
    rule.type === 'exact'
      ? normalized === rule.hostname
      : normalized !== rule.hostname && normalized.endsWith(`.${rule.hostname}`)
  );
}
