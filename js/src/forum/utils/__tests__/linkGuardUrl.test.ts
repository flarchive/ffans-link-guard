import { describe, expect, test } from '@jest/globals';

import { buildLinkGuardUrl, isHttpUrl, isSameOrigin, parseLinkGuardTarget, shouldProtectUrl } from '../linkGuardUrl';
import { parseTrustedDomains } from '../trustedDomains';

const forum = new URL('https://forum.example/forum/d/1');

describe('URL classification', () => {
  test.each([
    ['/internal', false],
    ['#post-2', false],
    ['https://forum.example/other', false],
    ['https://forum.example:443/path', false],
    ['http://forum.example/path', true],
    ['https://forum.example:8443/path', true],
    ['https://forum.example.evil.org', true],
    ['http://external.org', true],
    ['https://external.org', true],
    ['//external.org/path', true],
    ['mailto:user@example.com', false],
    ['tel:123', false],
    ['javascript:alert(1)', false],
    ['data:text/html,test', false],
    ['https://github.com/path', false],
    ['https://a.example.com/path', false],
    ['https://example.com/path', true],
  ])('%s protection: %s', (href, expected) => {
    expect(shouldProtectUrl(new URL(href, forum), forum, parseTrustedDomains('github.com\n*.example.com'))).toBe(
      expected
    );
  });

  test('compares protocol, hostname and port', () => {
    expect(isSameOrigin(new URL('https://forum.example:443/foo'), forum)).toBe(true);
    expect(isSameOrigin(new URL('http://forum.example/foo'), forum)).toBe(false);
    expect(isSameOrigin(new URL('https://forum.example:444/foo'), forum)).toBe(false);
    expect(isHttpUrl(new URL('ftp://example.org'))).toBe(false);
  });
});

describe('fragment transport', () => {
  test.each([
    'https://example.org/a?token=123&b=2#section',
    'http://example.org:8443/a%2Fb?percent=%25&plus=a+b#hash%23part',
    'https://xn--fsqu00a.xn--fiqs8s/',
    'https://example.org/?text=%3Cscript%3E%22%27%26',
  ])('preserves %s', (href) => {
    const target = new URL(href);
    const warning = new URL(buildLinkGuardUrl('/forum/link-guard', target), forum);
    expect(warning.pathname).toBe('/forum/link-guard');
    expect(warning.search).toBe('');
    expect(parseLinkGuardTarget(warning.hash)?.href).toBe(target.href);
  });

  test.each([
    '',
    '#',
    '#url=',
    '#other=x',
    '#url=not-a-url',
    '#url=/relative',
    '#url=javascript:alert(1)',
    '#url=data:text/html,test',
    '#url=mailto:user@example.org',
    '#url=tel:123',
    '#url=%E0%A4%A',
    '#url=https%3A%2F%2F%',
  ])('rejects %s', (hash) => {
    expect(parseLinkGuardTarget(hash)).toBeNull();
  });
});
