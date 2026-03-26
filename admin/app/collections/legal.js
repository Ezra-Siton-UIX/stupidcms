// Fields: name (primary) | article_date, body, accessibility_contact_name, accessibility_contact_phone, accessibility_contact_email
window.COLLECTION_SCHEMAS.legal = {
  key: 'legal',
  label: 'Legal',
  singular: 'Legal Page',
  newLabel: '+ New Legal Page',
  emptyMessage: 'No legal pages yet. Add your first legal page!',
  navGroup: 'legal',
  navGroupLabel: 'Legal',
  navPrimary: true,
  navVisible: true,
  navOrder: 70,
  primary: { key: 'name', label: 'Name', placeholder: 'Privacy Policy' },
  hasSinglePage: true,
  slugPrefix: '/legal/',
  metadataNote: 'Use this for cookie policy, privacy policy, accessibility statement, and similar legal pages. Accessibility coordinator fields are optional and separate for frontend highlighting.',
  list: {
    image: null,
    placeholder: '§',
    subtitle: function (item) {
      var parts = [];
      if (item.article_date) {
        parts.push(new Date(item.article_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        }));
      }
      if (item.accessibility_contact_name) parts.push('Accessibility coordinator');
      return parts.join(' · ');
    },
  },
  extraFields: [
    { key: 'article_date', label: 'Date', type: 'date', required: true },
    { key: 'body', label: 'Body', type: 'richtext', placeholder: 'Write the legal content here...', toolbar: 'full', required: true },
    { key: 'accessibility_contact_name', label: 'Accessibility Coordinator Name', type: 'text', placeholder: 'Full name...', hint: 'Optional. Use when you want to highlight the accessibility coordinator in the frontend.' },
    { key: 'accessibility_contact_phone', label: 'Accessibility Coordinator Phone', type: 'phone', placeholder: '+972 50-123-4567' },
    { key: 'accessibility_contact_email', label: 'Accessibility Coordinator Email', type: 'email', placeholder: 'accessibility@example.com' },
  ],
};
