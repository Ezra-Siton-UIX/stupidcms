// QuillEditor — rich text editor wrapper
// Rich text editor wrapper using Quill.js

const { useRef, useEffect } = React;

window.QuillEditor = function QuillEditor({ value, onChange, placeholder, toolbar, siteDir, collection }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isProgrammaticUpdateRef = useRef(false);
  onChangeRef.current = onChange;
  const MAX_RICHTEXT_IMAGE_SIZE = 2 * 1024 * 1024;

  const toolbarConfig = toolbar === 'minimal'
    ? [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']]
    : [[{ header: [2, 3, false] }], ['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['image'], ['clean']];

  useEffect(() => {
    if (quillRef.current || !containerRef.current) return;

    const q = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder || '',
      modules: { toolbar: toolbarConfig },
    });

    if (siteDir) {
      q.root.style.direction = siteDir;
      q.root.style.textAlign = siteDir === 'rtl' ? 'right' : 'left';
    }

    if (value) q.root.innerHTML = value;

    q.on('text-change', () => {
      if (isProgrammaticUpdateRef.current) return;
      onChangeRef.current(q.root.innerHTML);
    });

    const toolbarModule = q.getModule('toolbar');
    if (toolbarModule && toolbarModule.container) {
      const toolbarContainer = toolbarModule.container;
      const setControlLabel = (selector, label) => {
        toolbarContainer.querySelectorAll(selector).forEach(control => {
          control.setAttribute('title', label);
          control.setAttribute('aria-label', label);
        });
      };

      setControlLabel('.ql-header', 'Heading');
      setControlLabel('.ql-bold', 'Bold');
      setControlLabel('.ql-italic', 'Italic');
      setControlLabel('.ql-image', 'Insert image');
      setControlLabel('.ql-clean', 'Clear formatting');

      toolbarContainer.querySelectorAll('.ql-list').forEach(control => {
        const listType = control.getAttribute('value');
        const label = listType === 'ordered' ? 'Numbered list' : 'Bullet list';
        control.setAttribute('title', label);
        control.setAttribute('aria-label', label);
      });
    }

    if (toolbarModule && toolbar !== 'minimal') {
      toolbarModule.addHandler('image', () => {
        const backendStatus = window.__BACKEND_STATUS || { status: 'checking', supportsUploads: false };
        if (backendStatus.status !== 'ok' || !backendStatus.supportsUploads) {
          window.showAlert('Uploads are currently disabled. Connect to the correct backend first.');
          return;
        }

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;

          if (file.size > MAX_RICHTEXT_IMAGE_SIZE) {
            window.showAlert('Image is too large. Max 2MB for content images.');
            return;
          }

          try {
            const uploadCollection = collection || 'posts';
            const result = await api.upload(file, uploadCollection);
            console.log('%c📝 Rich text image inserted', 'color:#8b5cf6;font-weight:bold', { url: result.url, collection: uploadCollection });
            const range = q.getSelection(true);
            const index = range ? range.index : q.getLength();
            q.insertEmbed(index, 'image', result.url, 'user');
            q.setSelection(index + 1, 0, 'silent');
            onChangeRef.current(q.root.innerHTML);
          } catch (error) {
            console.error('%c❌ Rich text image upload failed', 'color:#ef4444;font-weight:bold', error);
            window.showAlert(error && error.message ? error.message : 'Image upload failed.');
          }
        };
      });
    }

    quillRef.current = q;
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;

    const nextValue = value || '';
    if (q.root.innerHTML === nextValue) return;

    isProgrammaticUpdateRef.current = true;
    q.root.innerHTML = nextValue;
    isProgrammaticUpdateRef.current = false;
  }, [value]);

  return <div ref={containerRef} className="bg-white" />;
};
