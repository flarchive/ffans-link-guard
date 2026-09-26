import Extend from 'flarum/common/extenders';

import LinkGuardPage from './pages/LinkGuardPage';

// oxfmt-ignore
export default [
  new Extend.Routes().add('ffansLinkGuard', '/link-guard', LinkGuardPage)
];
