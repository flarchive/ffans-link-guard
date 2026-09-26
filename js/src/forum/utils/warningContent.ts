import extractText from 'flarum/common/utils/extractText';
import app from 'flarum/forum/app';

export default function warningContent() {
  const forumName =
    app.forum.attribute<string>('title') ||
    extractText(app.translator.trans('ffans-link-guard.lib.default_forum_name'));
  const customTitle = app.forum.attribute<string>('linkGuardWarningTitle') || '';
  const customMessage = app.forum.attribute<string>('linkGuardWarningMessage') || '';

  return {
    forumName,
    title: customTitle.trim()
      ? customTitle
      : extractText(app.translator.trans('ffans-link-guard.lib.default_warning_title', { forumName })),
    message: customMessage.trim()
      ? customMessage
      : extractText(app.translator.trans('ffans-link-guard.lib.default_warning_message')),
  };
}
