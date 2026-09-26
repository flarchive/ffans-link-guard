import app from 'flarum/forum/app';

import protectExternalLinks from './extenders/protectExternalLinks';

export { default as extend } from './extend';

app.initializers.add('ffans-link-guard', () => {
  protectExternalLinks();
});
