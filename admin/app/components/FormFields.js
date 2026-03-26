// FormFields — renderField / renderFields
// renderFields + renderField — renders all field types in the editor

function renderFields(fields, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields) {
  const out = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.half && i + 1 < fields.length && fields[i + 1].half) {
      out.push(
        <div key={'grid-' + i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {renderField(fields[i], data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields)}
          {renderField(fields[i + 1], data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields)}
        </div>
      );
      i += 2;
    } else {
      out.push(renderField(f, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields));
      i++;
    }
  }
  return out;
}

function renderField(field, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields) {
  const val = data[field.key] || '';
  const err = errors[field.key];
  const isChangedField = !!(changedFields && changedFields.has(field.key));

  function wrapField(content) {
    if (!content || !isChangedField) return content;
    return React.cloneElement(content, {
      style: {
        ...(content.props.style || {}),
        border: '1px solid #fdba74',
        background: '#fff7ed',
        borderRadius: '0.85rem',
        padding: '0.85rem',
      },
    });
  }

  function renderLabel() {
    return (
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
        {field.label}
        {field.required && <span className="text-red-400 ml-1 normal-case font-normal tracking-normal">*</span>}
        {isChangedField && (
          <span style={{ marginLeft: '0.5rem', padding: '0.12rem 0.38rem', borderRadius: '9999px', background: '#ffedd5', color: '#c2410c', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            Changed
          </span>
        )}
      </label>
    );
  }

  function renderHint() {
    if (!field.hint) return null;
    return <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{field.hint}</p>;
  }

  switch (field.type) {
    case 'title':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="text" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            className="uk-input"
            style={{
              width: '100%',
              fontSize: '1.375rem',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f8fafc',
              border: err ? '2px solid #dc2626' : '1px solid #cbd5e1',
              borderRadius: '0.9rem',
              padding: '0.95rem 1rem',
              boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'text':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="text" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            maxLength={field.maxLength || undefined}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {field.maxLength && (
            <p style={{ fontSize: '0.72rem', color: val.length >= field.maxLength ? '#f87171' : val.length > field.maxLength * 0.85 ? '#f59e0b' : '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
              {val.length} / {field.maxLength}
            </p>
          )}
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'url':
    case 'link':
      const normalizedLink = normalizeLinkValue(val);
      const isLinkValid = !!val && isValidLinkValue(val);
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="url" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={e => {
              const normalized = normalizeLinkValue(e.target.value);
              if (normalized !== e.target.value) updateField(field.key, normalized);
              if (onFieldBlur) onFieldBlur(field.key);
            }}
            placeholder={field.placeholder}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {isLinkValid && (
            <a
              href={normalizedLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b', textDecoration: 'underline' }}
            >
              <span>Open link</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'date':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="date" value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'reference':
      const options = referenceOptions[field.sourceCollection] || [];
      const labelKey = field.labelKey || 'name';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <select
            value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={err ? { background: '#fff', borderColor: '#dc2626', borderWidth: '2px' } : { background: '#fff' }}
          >
            <option value="">{field.placeholder || 'Select item...'}</option>
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option[labelKey] || option.id}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            {options.length ? 'Linked to ' + options.length + ' available records.' : 'No records found yet. Create one first in ' + (COLLECTIONS[field.sourceCollection]?.label || 'the linked collection') + '.'}
          </p>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'slug':
      const fullUrl = !field.disabled && domain && val ? (domain + field.prefix + val) : '';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
              <div style={{ display: 'flex', border: err ? '2px solid #dc2626' : '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', opacity: field.disabled ? 0.55 : 1 }}>
                <span style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace', borderRight: err ? '2px solid #dc2626' : '1px solid #e5e7eb', userSelect: 'none' }}>
              {field.prefix}
            </span>
            <input
              type="text" value={val}
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
                  disabled={field.disabled}
              placeholder={field.placeholder || 'my-slug'}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#374151', border: 'none', outline: 'none', background: field.disabled ? '#f9fafb' : '#fff', cursor: field.disabled ? 'not-allowed' : 'text' }}
            />
          </div>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
              <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.25rem' }}>
                {field.disabled ? (field.disabledNote || 'This URL is disabled for this collection.') : ('lowercase, hyphens only — auto-generated from ' + field.autoFrom)}
              </p>
          {fullUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.375rem',
                padding: '0.45rem 0.6rem',
                border: '1px solid #2563eb',
                borderRadius: '0.375rem',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.75rem',
                textDecoration: 'none',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ opacity: 0.7 }}>↗</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullUrl}</span>
            </a>
          )}
        </div>
      );

    case 'prefixed':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', border: err ? '2px solid #dc2626' : '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <span style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', color: '#9ca3af', fontSize: '0.75rem', borderRight: err ? '2px solid #dc2626' : '1px solid #e5e7eb', userSelect: 'none' }}>
              {field.prefix}
            </span>
            <input
              type="text" value={val}
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              placeholder={field.placeholder}
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#374151', border: 'none', outline: 'none' }}
            />
          </div>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'image':
      const previewMode = field.previewMode || 'cover';
      const imageSize = field.imageSize || (previewMode === 'avatar' ? 'medium' : 'cover');
      const uploadInfo = uploadState[field.key] || { status: 'idle', message: '', folder: '' };
      const imageMeta = uploadInfo.meta && uploadInfo.meta.url === val ? uploadInfo.meta : null;
      const backendStatus = window.__BACKEND_STATUS || { status: 'checking', supportsUploads: false, message: 'Checking backend connection...' };
      const uploadsBlocked = backendStatus.status !== 'ok' || !backendStatus.supportsUploads;
      const sizeConfig = {
        cover: { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' },
        medium: { maxPreviewWidth: '420px', dropzoneMaxWidth: '560px', avatarSize: '7rem', dropzonePadding: '1.2rem' },
        small: { maxPreviewWidth: '240px', dropzoneMaxWidth: '340px', avatarSize: '5rem', dropzonePadding: '0.9rem' },
        // Backward compatibility for older schema values.
        full: { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' },
      }[imageSize] || { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' };
      const previewStyle = previewMode === 'avatar'
        ? {
            width: sizeConfig.avatarSize,
            height: sizeConfig.avatarSize,
            objectFit: 'cover',
            borderRadius: '9999px',
            margin: '0 auto 0.75rem',
            display: 'block',
            background: '#f3f4f6',
          }
        : {
            width: '100%',
            maxWidth: sizeConfig.maxPreviewWidth,
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '0.75rem',
            margin: '0 auto 0.75rem',
            display: 'block',
          };
      const metaSummary = imageMeta
        ? [
            imageMeta.width && imageMeta.height ? (imageMeta.width + ' x ' + imageMeta.height + ' px') : '',
            imageMeta.bytes ? formatFileSize(imageMeta.bytes) : '',
            imageMeta.format || '',
          ].filter(Boolean).join(' · ')
        : '';

      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div
            onClick={() => {
              if (uploadsBlocked) {
                const hint = backendStatus.suggestedBase ? (' Switch to ' + backendStatus.suggestedBase + ' first.') : '';
                window.showAlert((backendStatus.message || 'Uploads are currently disabled.') + hint);
                return;
              }
              document.getElementById('img-' + field.key)?.click();
            }}
            style={{ position: 'relative', border: '2px dashed ' + (uploadsBlocked ? '#fca5a5' : '#e5e7eb'), borderRadius: '1rem', padding: sizeConfig.dropzonePadding, maxWidth: sizeConfig.dropzoneMaxWidth || '100%', width: '100%', margin: '0 auto', textAlign: 'center', cursor: uploadsBlocked ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s', opacity: uploadsBlocked ? 0.75 : 1 }}
          >
            {val && (
              <button
                type="button"
                aria-label="Remove image"
                title="Remove image"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm('Are you sure you want to remove this image?')) return;
                  updateField(field.key, '');
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'idle', message: '', folder: '' }
                  }));
                }}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.75)',
                  background: 'rgba(17, 24, 39, 0.72)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                }}
              >
                🗑
              </button>
            )}
            {val ? (
              <img
                src={val}
                alt=""
                style={previewStyle}
                onLoad={e => {
                  const width = e.currentTarget.naturalWidth;
                  const height = e.currentTarget.naturalHeight;

                  setUploadState(prev => {
                    const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                    const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                    if (currentMeta.width === width && currentMeta.height === height) return prev;
                    return {
                      ...prev,
                      [field.key]: {
                        ...current,
                        meta: {
                          ...currentMeta,
                          url: val,
                          width,
                          height,
                        },
                      },
                    };
                  });

                  if (!imageMeta || (!imageMeta.bytes && !imageMeta.bytesPending)) {
                    setUploadState(prev => {
                      const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                      const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                      return {
                        ...prev,
                        [field.key]: {
                          ...current,
                          meta: {
                            ...currentMeta,
                            url: val,
                            width,
                            height,
                            bytesPending: true,
                          },
                        },
                      };
                    });

                    fetchRemoteImageMeta(val)
                      .then(remoteMeta => {
                        setUploadState(prev => {
                          const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                          const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                          return {
                            ...prev,
                            [field.key]: {
                              ...current,
                              meta: {
                                ...currentMeta,
                                url: val,
                                width,
                                height,
                                bytes: remoteMeta.bytes,
                                format: remoteMeta.format || currentMeta.format || getImageFormatLabel(val),
                                bytesPending: false,
                              },
                            },
                          };
                        });
                      })
                      .catch(() => {
                        setUploadState(prev => {
                          const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                          const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                          return {
                            ...prev,
                            [field.key]: {
                              ...current,
                              meta: {
                                ...currentMeta,
                                url: val,
                                width,
                                height,
                                format: currentMeta.format || getImageFormatLabel(val),
                                bytesPending: false,
                              },
                            },
                          };
                        });
                      });
                  }
                }}
              />
            ) : (
              <p style={{ fontSize: '0.875rem', color: uploadsBlocked ? '#dc2626' : '#9ca3af' }}>{uploadsBlocked ? 'Uploads are temporarily disabled' : 'Click to upload image'}</p>
            )}
            <p style={{ fontSize: '0.75rem', color: uploadsBlocked ? '#f87171' : '#d1d5db', marginTop: '0.25rem' }}>
              {uploadsBlocked ? (
                backendStatus.message || 'Backend check failed.'
              ) : (
                <>
                  Click to upload directly to{' '}
                  <a
                    href={val || 'https://cloudinary.com/' }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Cloudinary
                  </a>
                </>
              )}
            </p>
            <input
              id={'img-' + field.key}
              type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;
                const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
                if (file.size > MAX_IMAGE_SIZE) {
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'error', message: 'Image is too large. Max 2MB.', folder: '' }
                  }));
                  e.target.value = '';
                  return;
                }
                let localMeta = null;
                try {
                  localMeta = await readImageFileMeta(file);
                } catch (metaError) {
                  console.warn(metaError);
                }
                setUploadState(prev => ({
                  ...prev,
                  [field.key]: {
                    status: 'uploading',
                    message: 'Uploading to Cloudinary...',
                    folder: '',
                    meta: localMeta ? { ...localMeta, url: val || '' } : undefined,
                  }
                }));
                try {
                  const result = await api.upload(file, collection);
                  updateField(field.key, result.url);
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: {
                      status: 'uploaded',
                      message: 'Uploaded to Cloudinary',
                      folder: result.folder || '',
                      meta: localMeta ? { ...localMeta, url: result.url } : undefined,
                    }
                  }));
                } catch (error) {
                  console.error('Cloudinary upload failed', {
                    message: error && error.message ? error.message : error,
                    apiBase: window.API_BASE,
                    collection,
                    field: field.key,
                  });
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'error', message: error.message || 'Upload failed', folder: '' }
                  }));
                }
                e.target.value = '';
              }}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: uploadInfo.status === 'error' ? '#ef4444' : '#9ca3af', marginTop: '0.5rem' }}>
            {uploadInfo.message === 'Uploaded to Cloudinary' && val ? (
              <>
                Uploaded to{' '}
                <a
                  href={val}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Cloudinary
                </a>
              </>
            ) : (
              uploadInfo.message || (
                <>
                  Uploads are stored automatically in{' '}
                  <a
                    href={val || 'https://cloudinary.com/' }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Cloudinary
                  </a>
                  .
                </>
              )
            )}
            {uploadInfo.folder ? ' Folder: ' + uploadInfo.folder : ''}
          </p>
          {metaSummary && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{metaSummary}</p>}
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Max file size: 2MB</p>
          <input
            type="text" value={val}
            readOnly
            placeholder="Image URL will appear here"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280', outline: 'none', background: '#f9fafb', cursor: 'default' }}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'richtext':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <QuillEditor
            value={val}
            onChange={v => updateField(field.key, v)}
            placeholder={field.placeholder}
            toolbar={field.toolbar}
            siteDir={siteDir}
            collection={collection}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'checkbox':
      const isChecked = normalizeBooleanValue(val) === true;
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              padding: '0.6rem 0.85rem',
              borderRadius: '0.6rem',
              border: isChecked ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
              background: isChecked ? '#eff6ff' : '#fff',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={e => updateField(field.key, e.target.checked)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              className="accent-blue-600"
              style={{ flexShrink: 0 }}
            />
            <span className="text-sm text-gray-700">{field.checkboxLabel || field.label}</span>
          </label>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'radio':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.35rem' }}>
            {(field.options || []).map(opt => {
              const normalizedVal = (field.options || []).some(option => typeof option.value === 'boolean') ? normalizeBooleanValue(val) : val;
              const isChecked = normalizedVal === opt.value || (normalizedVal === undefined && opt.value === false);
              return (
                <label
                  key={String(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.6rem',
                    border: isChecked ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
                    background: isChecked ? '#eff6ff' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name={field.key}
                    checked={isChecked}
                    onChange={() => updateField(field.key, opt.value)}
                    onBlur={() => onFieldBlur && onFieldBlur(field.key)}
                    className="accent-blue-600"
                    style={{ flexShrink: 0 }}
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'number':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="number" value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step || 'any'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {field.min != null && field.max != null && (
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>Range: {field.min} – {field.max}</p>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'email':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="email" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder || 'email@example.com'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'phone':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="tel" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder || '+972 50-000-0000'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'textarea':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <textarea
            value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            maxLength={field.maxLength || undefined}
            className="uk-input"
            style={Object.assign({ resize: 'vertical', minHeight: '5rem', fontFamily: 'inherit', lineHeight: 1.6, padding: '0.65rem 0.75rem' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
          />
          {field.maxLength && (
            <p style={{ fontSize: '0.72rem', color: val.length >= field.maxLength ? '#f87171' : val.length > field.maxLength * 0.85 ? '#f59e0b' : '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
              {val.length} / {field.maxLength}
            </p>
          )}
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'select':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <select
            value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={Object.assign({ background: '#fff' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map(opt => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.label}
              </option>
            ))}
          </select>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'color':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="color" value={val || '#000000'}
              onChange={e => updateField(field.key, e.target.value)}
              style={{ width: '3rem', height: '2.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.15rem', cursor: 'pointer', background: '#fff' }}
            />
            <input
              type="text" value={val} dir="ltr"
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              placeholder={field.placeholder || '#000000'}
              maxLength={7}
              className="uk-input"
              style={Object.assign({ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
            />
          </div>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'video':
      const normalizedVideoUrl = normalizeLinkValue(val);
      const isVideoValid = !!val && isValidLinkValue(val);
      const videoEmbedUrl = isVideoValid ? getVideoEmbedUrl(normalizedVideoUrl) : '';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="url" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={e => {
              const normalized = normalizeLinkValue(e.target.value);
              if (normalized !== e.target.value) updateField(field.key, normalized);
              if (onFieldBlur) onFieldBlur(field.key);
            }}
            placeholder={field.placeholder || 'https://www.youtube.com/watch?v=...'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {isVideoValid && (
            <a
              href={normalizedVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b', textDecoration: 'underline' }}
            >
              <span>Open video</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {videoEmbedUrl && (
            <div style={{ marginTop: '0.75rem', borderRadius: '0.75rem', overflow: 'hidden', maxWidth: '480px', aspectRatio: '16/9' }}>
              <iframe
                src={videoEmbedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    default:
      return null;
  }
}

window.renderField = renderField;
window.renderFields = renderFields;
