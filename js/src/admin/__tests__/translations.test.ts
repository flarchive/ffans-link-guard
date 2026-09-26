import { beforeAll, expect, jest, test } from '@jest/globals';
import Translator from 'flarum/common/Translator';
import extractText from 'flarum/common/utils/extractText';

import { loadTranslations, useLocale } from '../../../test-utils/translations';

const app = {
  translator: new Translator(),
  data: { settings: { forum_title: 'Community' } },
  extensionData: { for: jest.fn().mockReturnThis(), registerSetting: jest.fn().mockReturnThis() },
};
jest.unstable_mockModule('flarum/admin/app', () => ({ default: app }));
let registerSettings: typeof import('../extend').default;
beforeAll(async () => {
  registerSettings = (await import('../extend')).default;
});

test.each([
  ['zh-Hans', '警告标题', '即将离开 Community', '请注意账号财产安全。', '使用弹窗提示'],
  [
    'en',
    'Warning title',
    'You are about to leave Community',
    'Please keep your account and personal information safe.',
    'Show warnings in a modal',
  ],
])('registers translated admin settings and string placeholders in %s', (locale, label, title, message, modalLabel) => {
  useLocale(app.translator, locale);
  app.data.settings.forum_title = 'Community';
  app.extensionData.registerSetting.mockClear();
  registerSettings();
  expect(app.extensionData.for).toHaveBeenCalledWith('ffans-link-guard');
  const settings = app.extensionData.registerSetting.mock.calls.map(([setting]) => setting as Record<string, string>);
  expect(settings).toHaveLength(4);
  expect(extractText(settings[0].label)).toBe(label);
  expect(settings[0].placeholder).toBe(title);
  expect(settings[1].placeholder).toBe(message);
  expect(extractText(settings[2].help)).toContain('*.example.com');
  expect(settings[3].setting).toBe('ffans-link-guard.use_modal');
  expect(settings[3].type).toBe('switch');
  expect(extractText(settings[3].label)).toBe(modalLabel);
  for (const setting of settings) {
    expect(extractText(setting.label)).not.toContain('ffans-link-guard.');
    expect(extractText(setting.help)).not.toContain('ffans-link-guard.');
  }
});

test('uses the translated forum fallback in the admin placeholder', () => {
  useLocale(app.translator, 'en');
  app.data.settings.forum_title = '';
  app.extensionData.registerSetting.mockClear();
  registerSettings();
  expect((app.extensionData.registerSetting.mock.calls[0][0] as Record<string, string>).placeholder).toBe(
    'You are about to leave this site'
  );
});

test('Chinese and English catalogues have the same nonempty keys and parameters', () => {
  const english = loadTranslations('en');
  const chinese = loadTranslations('zh-Hans');
  expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
  for (const [key, value] of Object.entries(english)) {
    expect(value.trim()).not.toBe('');
    expect(chinese[key].trim()).not.toBe('');
    expect(chinese[key].match(/\{\w+\}|<\/?\w+>/g)?.sort()).toEqual(value.match(/\{\w+\}|<\/?\w+>/g)?.sort());
  }
});
