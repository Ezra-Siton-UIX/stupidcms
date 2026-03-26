window.COLLECTION_SCHEMAS.media_publishers = {
  key: 'media_publishers',
  label: 'Publishers',
  singular: 'Publisher',
  newLabel: '+ New Publisher',
  emptyMessage: 'No media publishers yet.',
  navGroup: 'media',
  navGroupLabel: 'Media',
  navVisible: true,
  navSecondary: true,
  navOrder: 34,
  primary: { key: 'name', label: 'Name', placeholder: 'Ynet' },
  hasSinglePage: false,
  slugPrefix: '/media/publisher/',
  metadataNote: 'Reusable media publishers for external press/sites (for example: CNN, Ynet, TheMarker) so logo is managed once.',
  list: {
    image: 'logo_url',
    subtitle: function () { return ''; },
  },
  extraFields: [
    { key: 'logo_url', label: 'Logo', type: 'image', previewMode: 'avatar' },
  ],
};
