import type Mithril from 'mithril';

import Page, { type IPageAttrs } from 'flarum/common/components/Page';
import icon from 'flarum/common/helpers/icon';
import extractText from 'flarum/common/utils/extractText';
import app from 'flarum/forum/app';

import LinkGuardDestination from '../components/LinkGuardDestination';
import { parseLinkGuardTarget } from '../utils/linkGuardUrl';
import warningContent from '../utils/warningContent';

export default class LinkGuardPage extends Page {
  protected bodyClass = 'App--linkGuard';

  target: URL | null = null;

  private targetHash = '';
  private closeRequested = false;

  oninit(vnode: Mithril.Vnode<IPageAttrs, this>) {
    super.oninit(vnode);
    this.readTarget();
  }

  oncreate(vnode: Mithril.VnodeDOM<IPageAttrs, this>) {
    super.oncreate(vnode);
    app.setTitle(extractText(app.translator.trans('ffans-link-guard.forum.page_title')));
    app.setTitleCount(0);
    window.addEventListener('hashchange', this.onHashChange);
  }

  onremove(vnode: Mithril.VnodeDOM<IPageAttrs, this>) {
    window.removeEventListener('hashchange', this.onHashChange);
    super.onremove(vnode);
  }

  private onHashChange = () => {
    this.readTarget();
    m.redraw();
  };

  private readTarget() {
    this.targetHash = window.location.hash;
    this.target = parseLinkGuardTarget(this.targetHash);
  }

  view() {
    // A route redraw can reuse the Page before the hashchange event is dispatched.
    if (this.targetHash !== window.location.hash) this.readTarget();

    const { forumName, title, message } = warningContent();
    const logoUrl = app.forum.attribute<string>('logoUrl');
    const darkLogoUrl = app.forum.attribute<string>('logoDarkModeUrl');

    return (
      <div className="LinkGuardPage">
        <div className="LinkGuardPage-content">
          <div className="LinkGuardPage-brand">
            {logoUrl ? (
              <>
                <img className="Header-logo" src={logoUrl} alt={forumName} />
                {darkLogoUrl && (
                  <img className="Header-logo Header-logo--dark-mode" src={darkLogoUrl} alt={forumName} />
                )}
              </>
            ) : (
              forumName
            )}
          </div>

          <section
            className={`LinkGuardPage-notice${this.target ? '' : ' LinkGuardPage-invalid'}`}
            aria-labelledby="LinkGuardPage-title"
          >
            <h1 id="LinkGuardPage-title">
              {this.target ? title : app.translator.trans('ffans-link-guard.forum.invalid_title')}
            </h1>

            <p className="LinkGuardPage-message">
              {this.target ? message : app.translator.trans('ffans-link-guard.forum.invalid_message')}
            </p>

            {this.target && <LinkGuardDestination target={this.target} />}

            <div className="LinkGuardPage-actions">
              <button
                className="Button Button--outline"
                type="button"
                onclick={() => {
                  this.closeRequested = true;
                  window.close();
                }}
              >
                {app.translator.trans('ffans-link-guard.forum.close_button')}
              </button>
              {this.target && (
                <a
                  className="Button Button--primary"
                  href={this.target.href}
                  target="_self"
                  rel="nofollow noopener noreferrer external"
                  data-ffans-link-guard-bypass="1"
                >
                  {app.translator.trans('ffans-link-guard.forum.continue_button')}
                  {icon('fas fa-external-link-alt')}
                </a>
              )}
            </div>

            {this.closeRequested && (
              <p role="status" className="LinkGuardPage-footer">
                {app.translator.trans('ffans-link-guard.forum.close_fallback', {
                  a: <a href={this.backUrl()} />,
                })}
              </p>
            )}
          </section>
        </div>
      </div>
    );
  }

  private backUrl(): string {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === new URL(app.forum.attribute<string>('baseUrl')).origin) return referrer.href;
    } catch {
      // Missing or malformed referrers use the configured forum homepage.
    }
    return app.route('index');
  }
}
