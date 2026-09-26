import Component from 'flarum/common/Component';
import app from 'flarum/forum/app';

export default class LinkGuardDestination extends Component<{ target: URL }> {
  view() {
    const { target } = this.attrs;
    return (
      <dl className="LinkGuardPage-destination">
        <dt>{app.translator.trans('ffans-link-guard.forum.destination_label')}</dt>
        <dd className="LinkGuardPage-host" dir="ltr">
          {target.host}
        </dd>
        <dd className="LinkGuardPage-url" dir="ltr">
          {target.href}
        </dd>
      </dl>
    );
  }
}
