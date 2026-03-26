// Fields: question (primary) | category_id, answer
window.COLLECTION_SCHEMAS.faq = {
  key: 'faq',
  label: 'FAQ',
  singular: 'Question',
  newLabel: '+ New Question',
  emptyMessage: 'No questions yet. Add your first one!',
  navGroup: 'faq',
  navGroupLabel: 'FAQ',
  navPrimary: true,
  navVisible: true,
  navOrder: 50,
  primary: { key: 'question', label: 'Question', placeholder: 'Your question...' },
  hasSinglePage: false,
  slugPrefix: '/faq/',
  metadataNote: 'FAQ is shown as a list only. Each question does not get its own page.',
  list: {
    image: null,
    placeholder: '?',
    subtitle: function (item) { return item.category_name || ''; },
  },
  extraFields: [
    { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'faq_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...', half: true },
    { key: 'answer', label: 'Answer', type: 'richtext', placeholder: 'Write your answer here...', toolbar: 'full', required: true },
  ],
};
