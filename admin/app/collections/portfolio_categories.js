// Fields: name (primary)
window.COLLECTION_SCHEMAS.portfolio_categories = {
  key: 'portfolio_categories',
  label: 'Categories',
  singular: 'Category',
  newLabel: '+ New Category',
  emptyMessage: 'No portfolio categories yet.',
  navGroup: 'portfolio',
  navGroupLabel: 'Portfolio',
  navVisible: true,
  navSecondary: true,
  navOrder: 65,
  primary: { key: 'name', label: 'Category Name', placeholder: 'Web Design' },
  hasSinglePage: false,
  slugPrefix: '/portfolio/category/',
  metadataNote: 'Portfolio categories help organize projects into clear types such as Web Design or Branding.',
  list: {
    image: null,
    placeholder: '#',
    subtitle: function () { return ''; },
  },
  extraFields: [],
};
