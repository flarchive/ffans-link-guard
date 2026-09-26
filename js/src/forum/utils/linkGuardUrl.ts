import { isTrustedHostname, type TrustedDomainRule } from './trustedDomains';

export function isHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function isSameOrigin(url: URL, forumUrl: URL): boolean {
  return url.origin === forumUrl.origin;
}

export function shouldProtectUrl(url: URL, forumUrl: URL, rules: readonly TrustedDomainRule[]): boolean {
  return isHttpUrl(url) && !isSameOrigin(url, forumUrl) && !isTrustedHostname(url.hostname, rules);
}

export function buildLinkGuardUrl(baseRoute: string, target: URL): string {
  return `${baseRoute}#${new URLSearchParams({ url: target.href })}`;
}

export function parseLinkGuardTarget(hash: string): URL | null {
  const target = new URLSearchParams(hash.replace(/^#/, '')).get('url');
  if (!target) return null;

  try {
    const url = new URL(target);
    return isHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}
