import { describe, expect, test } from '@jest/globals';

import { isTrustedHostname, parseTrustedDomains } from '../trustedDomains';

describe('trusted domain rules', () => {
  test.each([
    ['github.com', 'github.com', true],
    ['github.com', 'www.github.com', false],
    ['github.com', 'gist.github.com', false],
    ['github.com', 'evilgithub.com', false],
    ['github.com', 'github.com.example.org', false],
    ['example.com', 'evil-example.com', false],
    ['*.example.com', 'a.example.com', true],
    ['*.example.com', 'a.b.example.com', true],
    ['*.example.com', 'example.com', false],
    ['*.example.com', 'fakeexample.com', false],
    ['*.example.com', 'example.com.evil.org', false],
    ['  GITHUB.COM.  ', 'GitHub.com.', true],
    ['例子.中国', 'xn--fsqu00a.xn--fiqs8s', true],
  ])('%s matches %s: %s', (rule, host, expected) => {
    expect(isTrustedHostname(host, parseTrustedDomains(rule))).toBe(expected);
  });

  test('ignores blank and invalid rules without broadening trust', () => {
    const raw =
      '\n github.com\r\n*.example.com\nhttps://evil.org\nevil.org/path\nevil.org?q=1\nevil.org#x\nuser@evil.org\nevil.org:80\nfoo.*.com\nexample.*\n*example.com\n%65vil.org\nevil.org\\path\nevil..org\n-evil.org\n';
    expect(parseTrustedDomains(raw)).toEqual([
      { type: 'exact', hostname: 'github.com' },
      { type: 'subdomain', hostname: 'example.com' },
    ]);
    expect(isTrustedHostname('bad host', parseTrustedDomains(raw))).toBe(false);
  });
});
