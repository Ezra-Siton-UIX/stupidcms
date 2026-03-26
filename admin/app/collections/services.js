window.COLLECTION_SCHEMAS.services = {
  key: 'services',
  label: 'Services',
  singular: 'Service',
  newLabel: '+ New Service',
  emptyMessage: 'No services yet. Add your first service!',
  navGroup: 'services',
  navGroupLabel: 'Services',
  navPrimary: true,
  navVisible: true,
  navOrder: 35,
  primary: { key: 'name', label: 'Service Name', placeholder: 'Service name...' },
  hasSinglePage: true,
  slugPrefix: '/services/',
  metadataNote: 'Each service can have its own single page on the website.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      return [item.category_name].filter(Boolean).join(' · ');
    },
  },
  extraFields: [
    { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'services_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...' },
    { key: 'image_url', label: 'Main Image', type: 'image' },
    { key: 'body', label: 'Body', type: 'richtext', placeholder: 'Describe the service...', toolbar: 'full', required: true },
  ],
};
