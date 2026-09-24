function mediaUrl(key) {
  const baseUrl = process.env.AWS_MEDIA_BASE_URL?.trim().replace(/\/$/, '');
  if (!baseUrl || !key) return '';
  return `${baseUrl}/${String(key).split('/').map(encodeURIComponent).join('/')}`;
}

function questionContentWithMedia(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return content || {};
  if (!content.image?.key) return content;
  return {
    ...content,
    image: {
      ...content.image,
      url: mediaUrl(content.image.key),
    },
  };
}

function questionWithMedia(question) {
  return { ...question, content: questionContentWithMedia(question.content) };
}

module.exports = { mediaUrl, questionContentWithMedia, questionWithMedia };
