window.COLLECTION_SCHEMAS.portfolio = {
  key: 'portfolio',
  label: 'Portfolio',
  singular: 'Project',
  newLabel: '+ New Project',
  emptyMessage: 'No projects yet. Add your first one!',
  navGroup: 'portfolio',
  navGroupLabel: 'Portfolio',
  navPrimary: true,
  navVisible: true,
  navOrder: 60,
  primary: { key: 'name', label: 'Project Name', placeholder: 'Project name...' },
  hasSinglePage: true,
  slugPrefix: '/portfolio/',
  metadataNote: 'Each project has its own single page on the website.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      return [item.category_name].filter(Boolean).join(' · ');
    },
  },
  extraFields: [
    { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'portfolio_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...' },
    { key: 'image_url', label: 'Main Image', type: 'image' },
    { key: 'body', label: 'Body', type: 'richtext', placeholder: 'Describe the project...', toolbar: 'full', required: true },
    { key: 'project_url', label: 'Project URL', type: 'link', placeholder: 'https://example.com', hint: 'The live URL of the project.' },
  ],
};
