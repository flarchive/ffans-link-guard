import Modal, { type IInternalModalAttrs } from 'flarum/common/components/Modal';
import icon from 'flarum/common/helpers/icon';
import app from 'flarum/forum/app';

import { parseLinkGuardTarget } from '../utils/linkGuardUrl';
import warningContent from '../utils/warningContent';

interface LinkGuardModalAttrs extends IInternalModalAttrs {
  targetHash: string;
}

export default class LinkGuardModal extends Modal<LinkGuardModalAttrs> {
  className() {
    return 'LinkGuardModal';
  }

  title() {
    return (
      <span className="LinkGuardModal-heading">
        <span className="LinkGuardModal-symbol" aria-hidden="true">
          {icon('fas fa-external-link-alt')}
        </span>
        <span className="LinkGuardModal-title">{this.warningTitle()}</span>
      </span>
    );
  }

  private warningTitle() {
    return parseLinkGuardTarget(this.attrs.targetHash)
      ? warningContent().title
      : app.translator.trans('ffans-link-guard.forum.invalid_title');
  }

  content() {
    const target = parseLinkGuardTarget(this.attrs.targetHash);

    return (
      <div className="LinkGuardModal-body">
        <p className="LinkGuardModal-message">
          {target ? warningContent().message : app.translator.trans('ffans-link-guard.forum.invalid_message')}
        </p>

        {target && (
          <dl className="LinkGuardModal-destination">
            <dt>{app.translator.trans('ffans-link-guard.forum.destination_label')}</dt>
            <dd className="LinkGuardModal-host" dir="ltr">
              {target.host}
            </dd>
            <dd className="LinkGuardModal-url" dir="ltr">
              {target.href}
            </dd>
          </dl>
        )}

        <div className="LinkGuardModal-actions">
          <button className="Button Button--outline" type="button" onclick={() => this.hide()}>
            {app.translator.trans('ffans-link-guard.forum.cancel_button')}
          </button>
          {target && (
            <a
              className="Button Button--primary"
              href={target.href}
              target="_blank"
              rel="nofollow noopener noreferrer external"
              data-ffans-link-guard-bypass="1"
              onclick={() => this.hide()}
            >
              {app.translator.trans('ffans-link-guard.forum.continue_button')}
            </a>
          )}
        </div>
      </div>
    );
  }
}
