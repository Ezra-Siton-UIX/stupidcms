window.COLLECTION_SCHEMAS.posts = {
  key: 'posts',
  label: 'Posts',
  singular: 'Post',
  newLabel: '+ New Post',
  emptyMessage: 'No posts yet. Create your first one!',
  navGroup: 'blog',
  navGroupLabel: 'Blog',
  navPrimary: true,
  navVisible: true,
  navOrder: 10,
  primary: { key: 'title', label: 'Title', placeholder: 'Post title...' },
  hasSinglePage: true,
  slugPrefix: '/blog/',
  metadataNote: 'Each post has its own single page on the website.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      var parts = [];
      var articleDate = item.article_date || item.date;
      if (item.featured === true) parts.push('⭐ Featured');
      if (item.author_name || item.author) parts.push(item.author_name || item.author);
      if (item.category_name) parts.push(item.category_name);
      if (articleDate) {
        parts.push(new Date(articleDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        }));
      }
      return parts.join(' · ');
    },
  },
  extraFields: [
    { key: 'article_date', label: 'Date', type: 'date', required: true },
    { key: 'author_id', label: 'Author', type: 'reference', sourceCollection: 'blog_authors', labelKey: 'name', mirrorKey: 'author_name', placeholder: 'Select author...', half: true },
    { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'blog_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...', half: true },
    { key: 'image_url', label: 'Cover Image', type: 'image' },
    { key: 'article_summary', label: 'Article Summary', type: 'text', placeholder: 'A short summary shown in post lists and used as the meta description...', maxLength: 160, hint: 'Used in post lists and as the page meta description. Keep it under 160 characters.' },
    { key: 'article_body', label: 'Article Body', type: 'richtext', placeholder: 'Write your post here...', toolbar: 'full', required: true },
    { key: 'featured', label: 'Feature Article', type: 'checkbox', checkboxLabel: '⭐ Featured article — highlight in priority lists', hint: 'Use this for articles you want to emphasize; leave unchecked for regular posts.' },
  ],
};
