import app from 'flarum/admin/app';
import extractText from 'flarum/common/utils/extractText';

export default function registerSettings() {
  app.extensionData
    .for('ffans-link-guard')
    .registerSetting({
      setting: 'ffans-link-guard.warning_title',
      type: 'text',
      label: app.translator.trans('ffans-link-guard.admin.settings.warning_title_label'),
      placeholder: extractText(
        app.translator.trans('ffans-link-guard.lib.default_warning_title', {
          forumName:
            app.data.settings.forum_title ||
            extractText(app.translator.trans('ffans-link-guard.lib.default_forum_name')),
        })
      ),
      help: app.translator.trans('ffans-link-guard.admin.settings.warning_title_help'),
    })
    .registerSetting({
      setting: 'ffans-link-guard.warning_message',
      type: 'textarea',
      label: app.translator.trans('ffans-link-guard.admin.settings.warning_message_label'),
      placeholder: extractText(app.translator.trans('ffans-link-guard.lib.default_warning_message')),
      help: app.translator.trans('ffans-link-guard.admin.settings.warning_message_help'),
    })
    .registerSetting({
      setting: 'ffans-link-guard.trusted_domains',
      type: 'textarea',
      label: app.translator.trans('ffans-link-guard.admin.settings.trusted_domains_label'),
      help: app.translator.trans('ffans-link-guard.admin.settings.trusted_domains_help'),
    })
    .registerSetting({
      setting: 'ffans-link-guard.use_modal',
      type: 'switch',
      label: app.translator.trans('ffans-link-guard.admin.settings.use_modal_label'),
      help: app.translator.trans('ffans-link-guard.admin.settings.use_modal_help'),
    });
}
