// Fields: name (primary) | role, image_url
window.COLLECTION_SCHEMAS.blog_authors = {
  key: 'blog_authors',
  label: 'Authors',
  singular: 'Author',
  newLabel: '+ New Author',
  emptyMessage: 'No authors yet.',
  navGroup: 'blog',
  navGroupLabel: 'Blog',
  navVisible: true,
  navSecondary: true,
  navOrder: 20,
  primary: { key: 'name', label: 'Name', placeholder: 'Author name...' },
  hasSinglePage: false,
  slugPrefix: '/blog/authors/',
  metadataNote: 'Authors are internal blog records. They do not have a single page on the website right now.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      return item.role || '';
    },
  },
  extraFields: [
    { key: 'role', label: 'Role', type: 'text', placeholder: 'Editor' },
    { key: 'image_url', label: 'Author Image', type: 'image', previewMode: 'avatar' },
  ],
};
