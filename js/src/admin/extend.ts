import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';

export default [
  new Extend.Admin()
    .setting(() => ({
      setting: 'ffans-link-guard.warning_title',
      type: 'text',
      label: app.translator.trans('ffans-link-guard.admin.settings.warning_title_label'),
      placeholder: app.translator.trans(
        'ffans-link-guard.lib.default_warning_title',
        {
          forumName:
            app.data.settings.forum_title || app.translator.trans('ffans-link-guard.lib.default_forum_name', {}, true),
        },
        true
      ),
      help: app.translator.trans('ffans-link-guard.admin.settings.warning_title_help'),
    }))
    .setting(() => ({
      setting: 'ffans-link-guard.warning_message',
      type: 'textarea',
      label: app.translator.trans('ffans-link-guard.admin.settings.warning_message_label'),
      placeholder: app.translator.trans('ffans-link-guard.lib.default_warning_message', {}, true),
      help: app.translator.trans('ffans-link-guard.admin.settings.warning_message_help'),
    }))
    .setting(() => ({
      setting: 'ffans-link-guard.trusted_domains',
      type: 'textarea',
      label: app.translator.trans('ffans-link-guard.admin.settings.trusted_domains_label'),
      help: app.translator.trans('ffans-link-guard.admin.settings.trusted_domains_help'),
    }))
    .setting(() => ({
      setting: 'ffans-link-guard.use_modal',
      type: 'switch',
      label: app.translator.trans('ffans-link-guard.admin.settings.use_modal_label'),
      help: app.translator.trans('ffans-link-guard.admin.settings.use_modal_help'),
    })),
];
