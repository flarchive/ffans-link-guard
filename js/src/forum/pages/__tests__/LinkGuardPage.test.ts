import m from 'mithril';

import { afterEach, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import Translator from 'flarum/common/Translator';

import { useLocale } from '../../../../test-utils/translations';

const attributes: Record<string, string> = {};
const app = {
  translator: new Translator(),
  forum: { attribute: (key: string) => attributes[key] },
  drawer: { hide: jest.fn() },
  modal: { close: jest.fn() },
  route: () => '/forum/',
  setTitle: jest.fn(),
  setTitleCount: jest.fn(),
};
jest.unstable_mockModule('flarum/forum/app', () => ({ default: app }));
let LinkGuardPage: typeof import('../LinkGuardPage').default;
beforeAll(async () => {
  LinkGuardPage = (await import('../LinkGuardPage')).default;
});
let root: HTMLElement;

beforeEach(() => {
  useLocale(app.translator, 'zh-Hans');
  jest.spyOn(window, 'close').mockImplementation(() => {});
  Object.defineProperty(window, 'app', { configurable: true, value: app });
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
  Object.keys(attributes).forEach((key) => delete attributes[key]);
  Object.assign(attributes, { title: '测试社区', baseUrl: 'http://localhost/forum' });
  window.location.hash = '#url=https%3A%2F%2Fexample.org%3A8443%2Fa%3Fx%3D1%26b%3D2%23section';
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  m.render(root, []);
  root.remove();
  jest.restoreAllMocks();
});

function render() {
  m.render(root, m(LinkGuardPage, { routeName: 'ffansLinkGuard' }));
}

function requestClose() {
  root.querySelector<HTMLButtonElement>('.LinkGuardPage-actions button')!.click();
  render();
}

test('requests closing the tab and offers a safe fallback if the page remains open', () => {
  render();
  expect(root.querySelector('.LinkGuardPage-actions button')?.textContent).toBe('关闭此页');
  expect(root.querySelector('[role="status"]')).toBeNull();
  requestClose();
  expect(window.close).toHaveBeenCalledTimes(1);
  expect(root.querySelector('[role="status"]')?.textContent).toContain('手动关闭标签页');
  expect(root.querySelector('[role="status"] a')?.getAttribute('href')).toBe('/forum/');
  expect(root.querySelector('[data-ffans-link-guard-bypass]')).not.toBeNull();
});

test('shows a separate title, message and destination with the port and full address', () => {
  render();
  expect(root.querySelector('h1')?.textContent).toBe('即将离开 测试社区');
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe('请注意账号财产安全。');
  expect(root.querySelector('.LinkGuardPage-destination dt')?.textContent).toBe('目标网站');
  expect(root.querySelector('.LinkGuardPage-host')?.textContent).toBe('example.org:8443');
  expect(root.querySelector('.LinkGuardPage-host')?.getAttribute('dir')).toBe('ltr');
  expect(root.querySelector('.LinkGuardPage-url')?.textContent).toBe('https://example.org:8443/a?x=1&b=2#section');
  expect(root.querySelector('.LinkGuardPage-url')?.getAttribute('dir')).toBe('ltr');
  expect(app.setTitle).toHaveBeenCalledWith('跳转提示');
  expect(app.setTitleCount).toHaveBeenCalledWith(0);
});

test('uses the forum name above the notice when no logo is configured', () => {
  render();
  expect(root.querySelector('.LinkGuardPage-brand')?.textContent).toBe('测试社区');
  expect(root.querySelector('.LinkGuardPage-brand img')).toBeNull();
});

test('uses configured light and dark forum logos with an accessible site name', () => {
  attributes.logoUrl = '/assets/logo.svg';
  attributes.logoDarkModeUrl = '/assets/logo-dark.svg';
  render();
  const logos = root.querySelectorAll<HTMLImageElement>('.LinkGuardPage-brand img');
  expect(Array.from(logos, (logo) => logo.getAttribute('src'))).toEqual(['/assets/logo.svg', '/assets/logo-dark.svg']);
  expect(Array.from(logos, (logo) => logo.alt)).toEqual(['测试社区', '测试社区']);
});

test('limits the standalone shell to the warning page lifecycle', () => {
  render();
  expect(document.querySelector('#app')?.classList.contains('App--linkGuard')).toBe(true);
  m.render(root, []);
  expect(document.querySelector('#app')?.classList.contains('App--linkGuard')).toBe(false);
});

test('renders custom settings as plain text and keeps newlines', () => {
  attributes.linkGuardWarningTitle = '<img src=x onerror=alert(1)>';
  attributes.linkGuardWarningMessage = '<script>alert(1)</script>\n第二行';
  render();
  expect(root.querySelector('h1')?.textContent).toBe(attributes.linkGuardWarningTitle);
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe(attributes.linkGuardWarningMessage);
  expect(root.querySelector('img, script')).toBeNull();
});

test('uses defaults for whitespace settings and a missing forum title', () => {
  attributes.title = '';
  attributes.linkGuardWarningTitle = '  ';
  attributes.linkGuardWarningMessage = '\n';
  render();
  expect(root.querySelector('h1')?.textContent).toBe('即将离开 本站');
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe('请注意账号财产安全。');
});

test('continue is a validated same-tab anchor with the original query and fragment', () => {
  render();
  const link = root.querySelector<HTMLAnchorElement>('[data-ffans-link-guard-bypass]');
  expect(link?.href).toBe('https://example.org:8443/a?x=1&b=2#section');
  expect(link?.target).toBe('_self');
  expect(link?.rel).toBe('nofollow noopener noreferrer external');
  expect(root.querySelector('.LinkGuardPage-destination a')).toBeNull();
});

test.each([
  ['', '/forum/'],
  ['https://external.org/from', '/forum/'],
  ['not a URL', '/forum/'],
  ['http://localhost:8443/d/1', '/forum/'],
  ['http://localhost/forum/d/1', 'http://localhost/forum/d/1'],
])('back uses a same-origin referrer or homepage: %s', (referrer, expected) => {
  Object.defineProperty(document, 'referrer', { configurable: true, value: referrer });
  render();
  requestClose();
  expect(root.querySelector('[role="status"] a')?.getAttribute('href')).toBe(expected);
});

test.each(['', '#url=', '#url=javascript:alert(1)', '#url=data:text/html,test', '#url=%E0%A4%A', '#url=invalid'])(
  'invalid target offers Close and a return fallback without Continue: %s',
  (hash) => {
    window.location.hash = hash;
    render();
    expect(root.querySelector('h1')?.textContent).toBe('无效的外部链接');
    expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe(
      '这个地址无法被安全识别，请返回社区后重新打开。'
    );
    expect(root.querySelector('.LinkGuardPage-destination')).toBeNull();
    expect(root.querySelector('[data-ffans-link-guard-bypass]')).toBeNull();
    expect(root.querySelectorAll('a')).toHaveLength(0);
    requestClose();
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(root.querySelectorAll('a')).toHaveLength(1);
    expect(root.querySelector('a')?.textContent).toBe('返回社区');
  }
);

test('revalidates a changed fragment when the Page instance is reused', () => {
  render();
  window.location.hash = '#url=javascript:alert(1)';
  render();
  expect(root.querySelector('[data-ffans-link-guard-bypass]')).toBeNull();
  window.location.hash = '#url=https%3A%2F%2Fsecond.example%2F';
  render();
  expect(root.querySelector<HTMLAnchorElement>('[data-ffans-link-guard-bypass]')?.href).toBe('https://second.example/');
});

test('target punctuation is rendered only as address text', () => {
  const target = new URL('https://example.org/path?value=<img src=x onerror=alert(1)>"\'&other=1');
  window.location.hash = new URLSearchParams({ url: target.href }).toString();
  render();
  expect(root.querySelector('.LinkGuardPage-url')?.textContent).toBe(target.href);
  expect(root.querySelector('img, script')).toBeNull();
  expect(root.querySelectorAll('a')).toHaveLength(1);
});

test('renders English defaults, buttons, page title and the translated return link', () => {
  useLocale(app.translator, 'en');
  attributes.title = '';
  render();
  expect(root.querySelector('h1')?.textContent).toBe('You are about to leave this site');
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe(
    'Please keep your account and personal information safe.'
  );
  expect(root.querySelector('.LinkGuardPage-destination dt')?.textContent).toBe('Destination website');
  expect(app.setTitle).toHaveBeenCalledWith('Leaving the forum');
  expect(root.querySelector('button')?.textContent).toBe('Close this tab');
  expect(root.querySelector('[data-ffans-link-guard-bypass]')?.textContent).toBe('Continue');
  requestClose();
  expect(root.querySelector('[role="status"]')?.textContent).toBe(
    'If this tab did not close, close it manually or return to the community.'
  );
  expect(root.querySelector('[role="status"] a')?.getAttribute('href')).toBe('/forum/');
});

test('renders the English invalid state without a continue link', () => {
  useLocale(app.translator, 'en');
  window.location.hash = '#url=javascript:alert(1)';
  render();
  expect(root.querySelector('h1')?.textContent).toBe('Invalid external link');
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe(
    'This address could not be recognized. Please return to the community and open the link again.'
  );
  expect(root.querySelector('[data-ffans-link-guard-bypass]')).toBeNull();
});

test('keeps custom title and message literal and separate across languages', () => {
  useLocale(app.translator, 'en');
  attributes.linkGuardWarningTitle = '<a href="https://evil.test">{forumName}</a>';
  attributes.linkGuardWarningMessage = '<script>alert(1)</script>\n{title}';
  render();
  expect(root.querySelector('h1')?.textContent).toBe(attributes.linkGuardWarningTitle);
  expect(root.querySelector('.LinkGuardPage-message')?.textContent).toBe(attributes.linkGuardWarningMessage);
  expect(root.querySelector('h1 a, script')).toBeNull();
});

test('treats the interpolated forum name as text', () => {
  attributes.title = '<img src=x onerror=alert(1)>{message}';
  render();
  expect(root.querySelector('h1')?.textContent).toBe(`即将离开 ${attributes.title}`);
  expect(root.querySelector('img')).toBeNull();
});
