// Fields: name (primary) | image_url, role, company, category_id, linkedin, bio
window.COLLECTION_SCHEMAS.team = {
  key: 'team',
  label: 'Team',
  singular: 'Member',
  newLabel: '+ New Member',
  emptyMessage: 'No team members yet.',
  navGroup: 'team',
  navGroupLabel: 'Team',
  navPrimary: true,
  navVisible: true,
  navOrder: 40,
  primary: { key: 'name', label: 'Name', placeholder: 'Full name...' },
  hasSinglePage: true,
  slugPrefix: '/team/',
  metadataNote: 'Each team member has a single page on the website.',
  list: {
    image: 'image_url',
    subtitle: function (item) {
      return [item.role, item.company, item.category_name].filter(Boolean).join(' · ');
    },
  },
  extraFields: [
    { key: 'image_url', label: 'Profile Image', type: 'image', previewMode: 'avatar' },
    { key: 'role', label: 'Role', type: 'text', placeholder: 'CEO', half: true },
    { key: 'company', label: 'Company', type: 'text', placeholder: 'Acme Inc.', half: true },
    { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'team_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...', half: true },
    { key: 'linkedin', label: 'LinkedIn', type: 'link', placeholder: 'https://linkedin.com/in/bobby-smith', hint: 'Example: https://linkedin.com/in/bobby-smith' },
    { key: 'bio', label: 'Bio', type: 'richtext', placeholder: 'Write a short bio...', toolbar: 'minimal', required: true },
  ],
};
