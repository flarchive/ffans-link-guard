import Icon from 'flarum/common/components/Icon';
import Modal, { type IInternalModalAttrs } from 'flarum/common/components/Modal';
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
    return parseLinkGuardTarget(this.attrs.targetHash)
      ? warningContent().title
      : app.translator.trans('ffans-link-guard.forum.invalid_title');
  }

  protected inner() {
    return (
      <>
        <div className="LinkGuardModal-heading">
          <span className="LinkGuardModal-symbol" aria-hidden="true">
            <Icon name="fas fa-arrow-up-right-from-square" />
          </span>
          <h3>{this.title()}</h3>
        </div>
        {this.content()}
      </>
    );
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
