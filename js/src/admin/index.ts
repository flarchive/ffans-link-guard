import app from 'flarum/admin/app';

import registerSettings from './extend';

app.initializers.add('ffans-link-guard', registerSettings);
