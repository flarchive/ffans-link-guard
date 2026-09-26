import { beforeEach, jest } from '@jest/globals';
import jquery from 'jquery';
import m from 'mithril';

Object.assign(window, { $: jquery, m });
Object.defineProperty(window, 'scrollTo', { configurable: true, value: jest.fn() });

beforeEach(() => {
  if (!document.getElementById('app')) {
    const root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
  }
});
