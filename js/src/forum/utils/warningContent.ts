import app from 'flarum/forum/app';

export default function warningContent() {
  const forumName =
    app.forum.attribute<string>('title') || app.translator.trans('ffans-link-guard.lib.default_forum_name', {}, true);
  const customTitle = app.forum.attribute<string>('linkGuardWarningTitle') || '';
  const customMessage = app.forum.attribute<string>('linkGuardWarningMessage') || '';

  return {
    forumName,
    title: customTitle.trim()
      ? customTitle
      : app.translator.trans('ffans-link-guard.lib.default_warning_title', { forumName }, true),
    message: customMessage.trim()
      ? customMessage
      : app.translator.trans('ffans-link-guard.lib.default_warning_message', {}, true),
  };
}
