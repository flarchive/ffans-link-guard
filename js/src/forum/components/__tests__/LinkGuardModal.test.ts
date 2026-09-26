import m from 'mithril';

import { afterEach, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import ModalManagerState from 'flarum/common/states/ModalManagerState';
import Translator from 'flarum/common/Translator';

import { useLocale } from '../../../../test-utils/translations';

const attributes: Record<string, string> = {};
const app = {
  translator: new Translator(),
  forum: { attribute: (key: string) => attributes[key] },
};
jest.unstable_mockModule('flarum/forum/app', () => ({ default: app }));
let LinkGuardModal: typeof import('../LinkGuardModal').default;
beforeAll(async () => {
  LinkGuardModal = (await import('../LinkGuardModal')).default;
});
let root: HTMLElement;
const hide = jest.fn();

beforeEach(() => {
  useLocale(app.translator, 'zh-Hans');
  app.translator.addTranslations({ 'core.lib.modal.close': 'Close' });
  Object.defineProperty(window, 'app', { configurable: true, value: app });
  Object.keys(attributes).forEach((key) => delete attributes[key]);
  attributes.title = '测试社区';
  hide.mockClear();
  jest.spyOn(window, 'close').mockImplementation(() => {});
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  m.render(root, []);
  root.remove();
  jest.restoreAllMocks();
});

function render(target = 'https://example.org:8443/a?x=%25&b=2#section') {
  const state = new ModalManagerState();
  state.modal = { componentClass: LinkGuardModal, key: 0 };
  m.render(
    root,
    m(LinkGuardModal, {
      targetHash: '#' + new URLSearchParams({ url: target }),
      state,
      animateShow: () => {},
      animateHide: hide,
    })
  );
}

test('shows the configured warning and complete destination in a native modal', () => {
  render();
  expect(root.querySelector('.Modal.LinkGuardModal')).not.toBeNull();
  expect(root.querySelector('h3')?.textContent).toBe('即将离开 测试社区');
  expect(root.querySelector('.LinkGuardModal-message')?.textContent).toBe('请注意账号财产安全。');
  expect(root.querySelector('.LinkGuardModal-host')?.textContent).toBe('example.org:8443');
  expect(root.querySelector('.LinkGuardModal-url')?.textContent).toBe('https://example.org:8443/a?x=%25&b=2#section');
  expect(root.querySelector('.LinkGuardModal-url')?.getAttribute('dir')).toBe('ltr');
  expect(root.querySelector('.LinkGuardModal-destination a')).toBeNull();
});

test('cancel and native close only dismiss the modal without changing the page', () => {
  const initialUrl = window.location.href;
  render();
  root.querySelector<HTMLButtonElement>('.LinkGuardModal-actions button')!.click();
  root.querySelector<HTMLButtonElement>('.Modal-close button')!.click();
  expect(hide).toHaveBeenCalledTimes(2);
  expect(window.close).not.toHaveBeenCalled();
  expect(window.location.href).toBe(initialUrl);
  expect(document.querySelector('#app')?.classList.contains('App--linkGuard')).toBe(false);
  expect(LinkGuardModal.dismissibleOptions).toMatchObject({
    viaCloseButton: true,
    viaEscKey: true,
    viaBackdropClick: true,
  });
});

test('continue opens a validated new-tab anchor and dismisses without cancelling navigation', () => {
  render();
  const link = root.querySelector<HTMLAnchorElement>('[data-ffans-link-guard-bypass]')!;
  expect(link.href).toBe('https://example.org:8443/a?x=%25&b=2#section');
  expect(link.target).toBe('_blank');
  expect(link.rel).toBe('nofollow noopener noreferrer external');
  let cancelled = true;
  link.addEventListener('click', (event) => {
    cancelled = event.defaultPrevented;
    event.preventDefault();
  });
  link.click();
  expect(cancelled).toBe(false);
  expect(hide).toHaveBeenCalledTimes(1);
});

test.each(['', 'javascript:alert(1)', 'data:text/html,test', 'invalid', '%E0%A4%A'])(
  'rejects invalid targets: %s',
  (target) => {
    render(target);
    expect(root.querySelector('h3')?.textContent).toBe('无效的外部链接');
    expect(root.querySelector('.LinkGuardModal-destination')).toBeNull();
    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('.LinkGuardModal-actions button')?.textContent).toBe('取消');
  }
);

test('custom warning and URL content stay literal text with preserved newlines', () => {
  attributes.linkGuardWarningTitle = '<img src=x onerror=alert(1)>{forumName}';
  attributes.linkGuardWarningMessage = '<script>alert(1)</script>\n第二行';
  const target = new URL('https://example.org/?value=<img src=x onerror=alert(1)>').href;
  render(target);
  expect(root.querySelector('h3')?.textContent).toBe(attributes.linkGuardWarningTitle);
  expect(root.querySelector('.LinkGuardModal-message')?.textContent).toBe(attributes.linkGuardWarningMessage);
  expect(root.querySelector('.LinkGuardModal-url')?.textContent).toBe(target);
  expect(root.querySelector('img, script')).toBeNull();
});

test('English defaults and actions use the same translations as the page', () => {
  useLocale(app.translator, 'en');
  attributes.title = '';
  attributes.linkGuardWarningTitle = ' ';
  attributes.linkGuardWarningMessage = '\n';
  render();
  expect(root.querySelector('h3')?.textContent).toBe('You are about to leave this site');
  expect(root.querySelector('.LinkGuardModal-message')?.textContent).toBe(
    'Please keep your account and personal information safe.'
  );
  expect(root.querySelector('.LinkGuardModal-destination dt')?.textContent).toBe('Destination website');
  expect(root.querySelector('.LinkGuardModal-actions button')?.textContent).toBe('Cancel');
  expect(root.querySelector('.LinkGuardModal-actions a')?.textContent).toBe('Continue');
});
