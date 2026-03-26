window.COLLECTION_SCHEMAS.media = {
  key: 'media',
  label: 'Media',
  singular: 'Media Item',
  newLabel: '+ New Media Item',
  emptyMessage: 'No media items yet. Add your first one!',
  navGroup: 'media',
  navGroupLabel: 'Media',
  navPrimary: true,
  navVisible: true,
  navOrder: 33,
  primary: { key: 'name', label: 'Name', placeholder: 'Media/site name...' },
  hasSinglePage: false,
  slugPrefix: '/media/',
  metadataNote: 'Media items represent external websites/articles and are managed as a list.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      var parts = [];
      if (item.publisher_name) parts.push(item.publisher_name);
      if (item.article_date) {
        parts.push(new Date(item.article_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        }));
      }
      return parts.join(' · ');
    },
  },
  extraFields: [
    { key: 'article_date', label: 'Article Date', type: 'date', required: true },
    { key: 'image_url', label: 'Main Image', type: 'image', previewMode: 'avatar', required: true },
    { key: 'publisher_id', label: 'Media Publisher', type: 'reference', sourceCollection: 'media_publishers', labelKey: 'name', mirrorKey: 'publisher_name', placeholder: 'Select publisher (e.g., CNN, Ynet)...', hint: 'Examples: CNN, Ynet, TheMarker', required: true },
    { key: 'article_url', label: 'Article Link (opens in new window)', type: 'link', placeholder: 'https://ynet.co.il/article.html', hint: 'Opens in a new window. Example: ynet.co.il/article.html', required: true },
    { key: 'article_date', label: 'Article Date', type: 'date', required: true },
  ],
};
