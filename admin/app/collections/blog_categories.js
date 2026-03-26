// Fields: name (primary)
window.COLLECTION_SCHEMAS.blog_categories = {
  key: 'blog_categories',
  label: 'Categories',
  singular: 'Category',
  newLabel: '+ New Category',
  emptyMessage: 'No categories yet.',
  navGroup: 'blog',
  navGroupLabel: 'Blog',
  navVisible: true,
  navSecondary: true,
  navOrder: 30,
  primary: { key: 'name', label: 'Category Name', placeholder: 'Category name...' },
  hasSinglePage: true,
  slugPrefix: '/blog/category/',
  metadataNote: 'Each category can have its own archive URL on the website.',
  list: {
    image: null,
    placeholder: '#',
    subtitle: function () { return ''; },
  },
  extraFields: [],
};
