// Fields: name (primary)
window.COLLECTION_SCHEMAS.team_categories = {
  key: 'team_categories',
  label: 'Categories',
  singular: 'Category',
  newLabel: '+ New Category',
  emptyMessage: 'No team categories yet.',
  navGroup: 'team',
  navGroupLabel: 'Team',
  navVisible: true,
  navSecondary: true,
  navOrder: 45,
  primary: { key: 'name', label: 'Category Name', placeholder: 'Advisory Board' },
  hasSinglePage: false,
  slugPrefix: '/team/category/',
  metadataNote: 'Team categories help organize members into reusable groups such as Advisory Board.',
  list: {
    image: null,
    placeholder: '#',
    subtitle: function () { return ''; },
  },
  extraFields: [],
};
