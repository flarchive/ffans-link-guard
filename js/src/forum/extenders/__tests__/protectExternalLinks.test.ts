import { beforeAll, beforeEach, expect, jest, test } from '@jest/globals';

import { parseLinkGuardTarget } from '../../utils/linkGuardUrl';

class PostFixture {
  element = document.createElement('article');
  html = '';
  oncreate() {
    this.element.innerHTML = this.html;
  }
  onupdate() {
    this.element.innerHTML = this.html;
  }
}
const readSetting = jest.fn((key: string) => (key === 'linkGuardUseModal' ? true : 'github.com\n*.example.com'));
const app = { forum: { attribute: readSetting }, route: () => '/forum/link-guard', modal: { show: jest.fn() } };
jest.unstable_mockModule('flarum/forum/app', () => ({ default: app }));
jest.unstable_mockModule('flarum/forum/components/CommentPost', () => ({ default: PostFixture }));
let processAnchor: typeof import('../protectExternalLinks').processAnchor;

beforeAll(async () => {
  const module = await import('../protectExternalLinks');
  processAnchor = module.processAnchor;
  module.default();
  expect(readSetting).not.toHaveBeenCalled();
});

beforeEach(() => {
  window.location.hash = '';
  app.modal.show.mockClear();
});

test.each([
  ['/internal', false],
  ['http://localhost/path', false],
  ['mailto:user@example.org', false],
  ['tel:123', false],
  ['https://external.org/a', true],
  ['http://external.org/a', true],
  ['//external.org/a', true],
  ['https://github.com/path', false],
  ['https://a.example.com/path', false],
  ['https://example.com/path', true],
])('lifecycle rewrites only untrusted HTTP(S): %s', (href, protectedLink) => {
  const post = new PostFixture();
  post.html = `<div class="Post-body"><a href="${href}">link</a></div><a href="https://outside.example">outside body</a>`;
  post.oncreate();
  const link = post.element.querySelector<HTMLAnchorElement>('.Post-body a')!;
  expect(link.hasAttribute('data-ffans-link-guard-processed')).toBe(protectedLink);
  expect(post.element.lastElementChild?.getAttribute('href')).toBe('https://outside.example');
  if (protectedLink)
    expect(parseLinkGuardTarget(new URL(link.href).hash)?.href).toBe(new URL(href, window.location.href).href);
  else expect(link.getAttribute('href')).toBe(href);
});

test('preserves anchor attributes and never double encodes', () => {
  const anchor = document.createElement('a');
  const attributes = {
    href: 'https://external.org/a?x=1&b=2#section',
    target: '_blank',
    rel: 'nofollow ugc',
    title: 'original',
    class: 'custom',
    'aria-label': 'link',
    'data-custom': 'value',
  };
  Object.entries(attributes).forEach(([name, value]) => anchor.setAttribute(name, value));
  processAnchor(anchor, [], '/forum/link-guard');
  const href = anchor.href;
  processAnchor(anchor, [], '/forum/link-guard');
  expect(anchor.href).toBe(href);
  for (const [name, value] of Object.entries(attributes)) {
    if (name !== 'href' && name !== 'rel') expect(anchor.getAttribute(name)).toBe(value);
  }
  expect(anchor.rel).toBe('nofollow ugc noopener');
  expect(parseLinkGuardTarget(new URL(href).hash)?.href).toBe(attributes.href);
});

test.each([null, '_self', '_parent', 'named-window', '_blank'])(
  'opens protected links in a new tab regardless of the original target: %s',
  (target) => {
    const anchor = document.createElement('a');
    anchor.href = 'https://external.org/';
    if (target !== null) anchor.target = target;
    processAnchor(anchor, [], '/forum/link-guard');
    expect(anchor.target).toBe('_blank');
    expect(anchor.relList.contains('noopener')).toBe(true);
    expect(new URL(anchor.href).pathname).toBe('/forum/link-guard');
  }
);

test.each(['http://localhost/path', 'mailto:user@example.org'])('keeps unprotected link attributes: %s', (href) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_self';
  anchor.rel = 'ugc';
  processAnchor(anchor, [], '/forum/link-guard');
  expect(anchor.href).toBe(href);
  expect(anchor.target).toBe('_self');
  expect(anchor.rel).toBe('ugc');
});

test('bypass marker leaves the original link alone', () => {
  const link = document.createElement('a');
  link.href = 'https://external.org/';
  link.setAttribute('data-ffans-link-guard-bypass', '');
  processAnchor(link, [], '/forum/link-guard');
  expect(link.href).toBe('https://external.org/');
});

test('one malformed link does not stop remaining links', () => {
  const post = new PostFixture();
  post.html = '<div class="Post-body"><a href="https://%">bad</a><a href="https://valid.org">valid</a></div>';
  expect(() => post.oncreate()).not.toThrow();
  expect(post.element.querySelectorAll('[data-ffans-link-guard-processed]')).toHaveLength(1);
});

test('new posts and replaced post content are processed after the core lifecycle', () => {
  for (let index = 0; index < 30; index++) {
    const post = new PostFixture();
    post.html = `<div class="Post-body"><a href="https://external.org/${index}">link</a></div>`;
    post.oncreate();
    expect(post.element.querySelector('[data-ffans-link-guard-processed]')).not.toBeNull();
    post.html = '<div class="Post-body"><a href="https://updated.org/">updated</a></div>';
    post.onupdate();
    const href = post.element.querySelector<HTMLAnchorElement>('a')!.href;
    expect(parseLinkGuardTarget(new URL(href).hash)?.href).toBe('https://updated.org/');
  }
  expect(readSetting).toHaveBeenCalledTimes(2);
});

function clickWithoutNavigation(anchor: HTMLAnchorElement, options: MouseEventInit = {}) {
  let intercepted = false;
  anchor.addEventListener(
    'click',
    (event) => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true }
  );
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...options }));
  return intercepted;
}

test('modal mode intercepts a plain click once while retaining the protected href', () => {
  const anchor = document.createElement('a');
  anchor.href = 'https://external.org/a?x=%25&b=2#section';
  processAnchor(anchor, [], '/forum/link-guard', true);
  processAnchor(anchor, [], '/forum/link-guard', true);
  expect(clickWithoutNavigation(anchor)).toBe(true);
  expect(app.modal.show).toHaveBeenCalledTimes(1);
  const [, attrs] = app.modal.show.mock.calls[0];
  expect(attrs).toEqual({ targetHash: anchor.hash });
  expect(parseLinkGuardTarget(anchor.hash)?.href).toBe('https://external.org/a?x=%25&b=2#section');
  expect(new URL(anchor.href).pathname).toBe('/forum/link-guard');
  expect(anchor.target).toBe('_blank');
});

test.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }])(
  'modal mode leaves modified and non-primary clicks on the warning route: %j',
  (options) => {
    const anchor = document.createElement('a');
    anchor.href = 'https://external.org/';
    processAnchor(anchor, [], '/forum/link-guard', true);
    expect(clickWithoutNavigation(anchor, options)).toBe(false);
    expect(app.modal.show).not.toHaveBeenCalled();
    expect(new URL(anchor.href).pathname).toBe('/forum/link-guard');
  }
);

test('a click already handled by another listener does not open the modal', () => {
  const anchor = document.createElement('a');
  anchor.href = 'https://external.org/';
  anchor.addEventListener('click', (event) => event.preventDefault());
  processAnchor(anchor, [], '/forum/link-guard', true);
  clickWithoutNavigation(anchor);
  expect(app.modal.show).not.toHaveBeenCalled();
});

test('the default page mode keeps plain clicks on the warning route', () => {
  const anchor = document.createElement('a');
  anchor.href = 'https://external.org/';
  processAnchor(anchor, [], '/forum/link-guard');
  expect(clickWithoutNavigation(anchor)).toBe(false);
  expect(app.modal.show).not.toHaveBeenCalled();
});

test.each(['http://localhost/internal', 'mailto:a@example.org', 'https://github.com/'])(
  'modal mode ignores unprotected links: %s',
  (href) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    processAnchor(anchor, [{ type: 'exact', hostname: 'github.com' }], '/forum/link-guard', true);
    expect(clickWithoutNavigation(anchor)).toBe(false);
    expect(app.modal.show).not.toHaveBeenCalled();
    expect(anchor.href).toBe(href);
  }
);

test('modal mode respects bypass markers', () => {
  const anchor = document.createElement('a');
  anchor.href = 'https://external.org/';
  anchor.setAttribute('data-ffans-link-guard-bypass', '1');
  processAnchor(anchor, [], '/forum/link-guard', true);
  expect(clickWithoutNavigation(anchor)).toBe(false);
  expect(app.modal.show).not.toHaveBeenCalled();
});

test('new and updated posts use the configured modal mode, including Enter activation', () => {
  const post = new PostFixture();
  post.html = '<div class="Post-body"><a href="https://first.example/">first</a></div>';
  post.oncreate();
  expect(clickWithoutNavigation(post.element.querySelector('a')!, { detail: 0 })).toBe(true);
  post.html = '<div class="Post-body"><a href="https://second.example/">second</a></div>';
  post.onupdate();
  expect(clickWithoutNavigation(post.element.querySelector('a')!)).toBe(true);
  expect(app.modal.show).toHaveBeenCalledTimes(2);
});
