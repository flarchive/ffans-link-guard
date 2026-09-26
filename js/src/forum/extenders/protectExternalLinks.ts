import { extend } from 'flarum/common/extend';
import app from 'flarum/forum/app';
import CommentPost from 'flarum/forum/components/CommentPost';

import LinkGuardModal from '../components/LinkGuardModal';
import { buildLinkGuardUrl, shouldProtectUrl } from '../utils/linkGuardUrl';
import { parseTrustedDomains, type TrustedDomainRule } from '../utils/trustedDomains';

export function processAnchor(
  anchor: HTMLAnchorElement,
  rules: readonly TrustedDomainRule[],
  route: string,
  useModal = false
): void {
  if (anchor.hasAttribute('data-ffans-link-guard-processed') || anchor.hasAttribute('data-ffans-link-guard-bypass'))
    return;

  try {
    const rawHref = anchor.getAttribute('href');
    if (!rawHref) return;
    const forumUrl = new URL(window.location.href);
    const target = new URL(rawHref, forumUrl);
    if (!shouldProtectUrl(target, forumUrl, rules)) return;

    anchor.setAttribute('href', buildLinkGuardUrl(route, target));
    anchor.setAttribute('target', '_blank');
    anchor.relList.add('noopener');
    anchor.setAttribute('data-ffans-link-guard-processed', '1');

    if (useModal) {
      anchor.addEventListener('click', (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;

        event.preventDefault();
        void app.modal.show(LinkGuardModal, { targetHash: anchor.hash });
      });
    }
  } catch {
    // A malformed link must not prevent this post's remaining links from working.
  }
}

export default function protectExternalLinks(): void {
  let rules: TrustedDomainRule[] | undefined;
  let useModal: boolean | undefined;

  function protectPostLinks(this: CommentPost) {
    // Initializers run before app.forum is assigned in Flarum 2.
    rules ??= parseTrustedDomains(app.forum.attribute<string>('linkGuardTrustedDomains') || '');
    useModal ??= app.forum.attribute<boolean>('linkGuardUseModal') === true;
    const route = app.route('ffansLinkGuard');
    this.element.querySelectorAll<HTMLAnchorElement>('.Post-body a[href]').forEach((anchor) => {
      processAnchor(anchor, rules!, route, useModal);
    });
  }

  extend(CommentPost.prototype, 'oncreate', protectPostLinks);
  extend(CommentPost.prototype, 'onupdate', protectPostLinks);
}
