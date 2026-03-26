// Component file manifest — admin/app/components/
//
// Each file self-registers on window (e.g. window.Layout = Layout).
// They are loaded individually by the boot loader in index.html.
//
// Load order matters — see index.html boot() for the correct sequence.
//
// Files:
//   OutlineIcon.js    — SVG icon component
//   ToastContainer.js — Toast notification renderer
//   AlertBox.js       — Modal alert/confirm dialog
//   Breadcrumbs.js    — Breadcrumb navigation
//   BackendWarning.js — Backend status warning banner
//   Layout.js         — Main app layout shell (depends on OutlineIcon, Breadcrumbs, ToastContainer)
//   QuillEditor.js    — Rich text editor wrapper (Quill.js)
//   FormFields.js     — renderField / renderFields (depends on QuillEditor)
//   ListPage.js       — Collection list view (depends on OutlineIcon, BackendWarning)
//   EditorPage.js     — Item editor (depends on OutlineIcon, BackendWarning, FormFields)
//   Nav.js            — Legacy nav component (unused by SPA)
