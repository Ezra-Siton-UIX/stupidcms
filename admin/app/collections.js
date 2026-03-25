// Collection schemas and generated collection configs.
// Single source of truth: edit COLLECTION_SCHEMAS only.

(function () {
  function getStorageValue(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  function isLocalHost(hostname) {
    return /^(localhost|127\.0\.0\.1)$/i.test(hostname || '');
  }

  function isLocalHttpUrl(value) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value || '');
  }

  var isLocalAdminHost = window.location.protocol !== 'file:' && isLocalHost(window.location.hostname);

  // API base — supports same-origin, file:// preview, and manual override.
  var fromStorage = getStorageValue('api_base');
  if (isLocalAdminHost) {
    window.API_BASE = window.location.origin;
    if (isLocalHttpUrl(fromStorage) && fromStorage !== window.location.origin) {
      localStorage.setItem('api_base', window.location.origin);
      sessionStorage.setItem('api_base', window.location.origin);
    }
  } else if (fromStorage) {
    window.API_BASE = fromStorage;
  } else {
    var isFile = window.location.protocol === 'file:';
    window.API_BASE = isFile ? 'http://localhost:3002' : window.location.origin;
  }
})();

function buildCommonFields(schema) {
  var primary = schema.primary;
  var hasSinglePage = !!schema.hasSinglePage;
  var fields = [
    {
      key: primary.key,
      label: primary.label,
      type: 'title',
      required: true,
      placeholder: primary.placeholder,
    },
    {
      key: 'slug',
      label: 'Slug',
      type: 'slug',
      prefix: schema.slugPrefix,
      autoFrom: primary.key,
      required: hasSinglePage,
      disabled: !hasSinglePage,
      disabledNote: hasSinglePage ? '' : 'This collection does not use internal single-page URLs. Use external links fields instead when relevant.',
    },
  ];

  return fields;
}

function buildCollection(schema) {
  var primaryKey = schema.primary.key;
  var fields = buildCommonFields(schema).concat(schema.extraFields || []);

  return {
    key: schema.key,
    label: schema.label,
    singular: schema.singular,
    newLabel: schema.newLabel,
    emptyMessage: schema.emptyMessage,
    hasSinglePage: !!schema.hasSinglePage,
    metadataNote: schema.metadataNote || '',
    navGroup: schema.navGroup || schema.key,
    navGroupLabel: schema.navGroupLabel || schema.label,
    navPrimary: !!schema.navPrimary,
    navSecondary: !!schema.navSecondary,
    navVisible: schema.navVisible !== false,
    navOrder: schema.navOrder || 0,
    list: {
      title: primaryKey,
      subtitle: schema.list.subtitle,
      image: schema.list.image,
      slug: schema.hasSinglePage ? 'slug' : null,
      placeholder: schema.list.placeholder || null,
    },
    fields: fields,
  };
}

window.COLLECTION_SCHEMAS = {
  posts: {
    key: 'posts',
    label: 'Posts',
    singular: 'Post',
    newLabel: '+ New Post',
    emptyMessage: 'No posts yet. Create your first one!',
    navGroup: 'blog',
    navGroupLabel: 'Blog',
    navPrimary: true,
    navVisible: true,
    navOrder: 10,
    primary: { key: 'title', label: 'Title', placeholder: 'Post title...' },
    hasSinglePage: true,
    slugPrefix: '/blog/',
    metadataNote: 'Each post has its own single page on the website.',
    list: {
      image: 'image_url',
      subtitle: function (item) {
        var parts = [];
        var articleDate = item.article_date || item.date;
        if (item.featured === true) parts.push('⭐ Featured');
        if (item.author_name || item.author) parts.push(item.author_name || item.author);
        if (item.category_name) parts.push(item.category_name);
        if (articleDate) {
          parts.push(new Date(articleDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          }));
        }
        return parts.join(' · ');
      },
    },
    extraFields: [
      { key: 'article_date', label: 'Date', type: 'date', required: true },
      { key: 'author_id', label: 'Author', type: 'reference', sourceCollection: 'blog_authors', labelKey: 'name', mirrorKey: 'author_name', placeholder: 'Select author...', half: true },
      { key: 'category_id', label: 'Category', type: 'reference', sourceCollection: 'blog_categories', labelKey: 'name', mirrorKey: 'category_name', placeholder: 'Select category...', half: true },
      { key: 'image_url', label: 'Cover Image', type: 'image' },
      { key: 'article_summary', label: 'Article Summary', type: 'text', placeholder: 'A short summary shown in post lists and used as the meta description...', maxLength: 160, hint: 'Used in post lists and as the page meta description. Keep it under 160 characters.' },
      { key: 'article_body', label: 'Article Body', type: 'richtext', placeholder: 'Write your post here...', toolbar: 'full', required: true },
      { key: 'featured', label: 'Feature Article', type: 'checkbox', checkboxLabel: '⭐ Featured article — highlight in priority lists', hint: 'Use this for articles you want to emphasize; leave unchecked for regular posts.' },
    ],
  },

  blog_authors: {
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
  },

  blog_categories: {
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
      subtitle: function () {
        return '';
      },
    },
    extraFields: [],
  },

  media: {
    key: 'media',
    label: 'Media',
    singular: 'Media Item',
    newLabel: '+ New Media Item',
    emptyMessage: 'No media items yet. Add your first one!',
    navGroup: 'media',
    navGroupLabel: 'Media',
    navPrimary: true,
    navVisible: true,
    navOrder: 33,
    primary: { key: 'name', label: 'Name', placeholder: 'Media/site name...' },
    hasSinglePage: false,
    slugPrefix: '/media/',
    metadataNote: 'Media items represent external websites/articles and are managed as a list.',
    list: {
      image: 'image_url',
      subtitle: function (item) {
        var parts = [];
        if (item.publisher_name) parts.push(item.publisher_name);
        if (item.article_date) {
          parts.push(new Date(item.article_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          }));
        }
        return parts.join(' · ');
      },
    },
    extraFields: [
      { key: 'article_date', label: 'Article Date', type: 'date', required: true },
      { key: 'image_url', label: 'Main Image', type: 'image', previewMode: 'avatar', required: true },
      { key: 'publisher_id', label: 'Media Publisher', type: 'reference', sourceCollection: 'media_publishers', labelKey: 'name', mirrorKey: 'publisher_name', placeholder: 'Select publisher (e.g., CNN, Ynet)...', hint: 'Examples: CNN, Ynet, TheMarker', required: true },
      { key: 'article_url', label: 'Article Link (opens in new window)', type: 'link', placeholder: 'https://ynet.co.il/article.html', hint: 'Opens in a new window. Example: ynet.co.il/article.html', required: true },
      { key: 'article_date', label: 'Article Date', type: 'date', required: true }
    ],
  },

  media_publishers: {
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
  },

  services: {
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
  },

  services_categories: {
    key: 'services_categories',
    label: 'Categories',
    singular: 'Category',
    newLabel: '+ New Category',
    emptyMessage: 'No service categories yet.',
    navGroup: 'services',
    navGroupLabel: 'Services',
    navVisible: true,
    navSecondary: true,
    navOrder: 36,
    primary: { key: 'name', label: 'Category Name', placeholder: 'Consulting' },
    hasSinglePage: false,
    slugPrefix: '/services/category/',
    metadataNote: 'Service categories help organize services into reusable groups.',
    list: {
      image: null,
      placeholder: '#',
      subtitle: function () { return ''; },
    },
    extraFields: [],
  },

  team: {
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
  },

  team_categories: {
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
  },

  faq: {
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
  },

  faq_categories: {
    key: 'faq_categories',
    label: 'Categories',
    singular: 'Category',
    newLabel: '+ New Category',
    emptyMessage: 'No FAQ categories yet.',
    navGroup: 'faq',
    navGroupLabel: 'FAQ',
    navVisible: true,
    navSecondary: true,
    navOrder: 55,
    primary: { key: 'name', label: 'Category Name', placeholder: 'Webflow' },
    hasSinglePage: false,
    slugPrefix: '/faq/category/',
    metadataNote: 'FAQ categories help organize questions into clear topics such as Webflow or Loveable.',
    list: {
      image: null,
      placeholder: '?',
      subtitle: function () { return ''; },
    },
    extraFields: [],
  },

  portfolio: {
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
  },

  portfolio_categories: {
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
  },

  legal: {
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
  },
};

// Site domains are defined once by the developer (not by clients in dashboard).
window.SITE_DOMAINS = {
  site_bobby: 'https://demo-bobby.example.com',
};

window.DEFAULT_SITE_DOMAIN = 'https://demo-site.example.com';

function isLocalHttpUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value || '');
}

window.getSiteDomain = function (siteId) {
  var runtimeBase = window.API_BASE || getStorageValue('api_base') || '';
  if (isLocalHttpUrl(runtimeBase)) {
    return runtimeBase;
  }

  if (isLocalHttpUrl(window.location.origin)) {
    return window.location.origin;
  }

  return window.SITE_DOMAINS[siteId] || window.DEFAULT_SITE_DOMAIN;
};

// --- Field type registry: valid types and their supported properties ---
var FIELD_TYPE_REGISTRY = {
  title:     { props: ['placeholder'] },
  slug:      { props: ['prefix', 'autoFrom', 'disabled', 'disabledNote'] },
  text:      { props: ['placeholder', 'maxLength', 'half'] },
  textarea:  { props: ['placeholder', 'maxLength', 'rows', 'half'] },
  email:     { props: ['placeholder', 'half'] },
  phone:     { props: ['placeholder', 'half'] },
  number:    { props: ['placeholder', 'min', 'max', 'step', 'half'] },
  date:      { props: ['half'] },
  link:      { props: ['placeholder', 'half'] },
  url:       { props: ['placeholder', 'half'] },
  image:     { props: ['previewMode', 'imageSize'] },
  video:     { props: ['placeholder'] },
  richtext:  { props: ['placeholder', 'toolbar'] },
  reference: { props: ['sourceCollection', 'labelKey', 'mirrorKey', 'placeholder', 'half'], required: ['sourceCollection'] },
  select:    { props: ['options', 'placeholder', 'half'], required: ['options'] },
  checkbox:  { props: ['checkboxLabel'] },
  radio:     { props: ['options'], required: ['options'] },
  color:     { props: ['placeholder', 'half'] },
  prefixed:  { props: ['prefix', 'placeholder', 'half'] },
};
window.FIELD_TYPE_REGISTRY = FIELD_TYPE_REGISTRY;

// Dev-time schema validation — console.warn only, never throws.
(function validateSchemas() {
  var schemas = window.COLLECTION_SCHEMAS;
  if (!schemas) return;
  Object.keys(schemas).forEach(function (collKey) {
    (schemas[collKey].extraFields || []).forEach(function (field) {
      var typeDef = FIELD_TYPE_REGISTRY[field.type];
      if (!typeDef) {
        console.warn('[Schema] Unknown field type "' + field.type + '" in ' + collKey + '.' + field.key + '. Supported: ' + Object.keys(FIELD_TYPE_REGISTRY).join(', '));
        return;
      }
      (typeDef.required || []).forEach(function (rp) {
        if (field[rp] == null) {
          console.warn('[Schema] ' + collKey + '.' + field.key + ' (type: ' + field.type + ') missing required "' + rp + '".');
        }
      });
    });
  });
})();

window.COLLECTIONS = Object.keys(window.COLLECTION_SCHEMAS).reduce(function (acc, key) {
  acc[key] = buildCollection(window.COLLECTION_SCHEMAS[key]);
  return acc;
}, {});
