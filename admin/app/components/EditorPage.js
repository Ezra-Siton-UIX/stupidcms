// EditorPage — single item editor
// Single item editor with validation, revisions, duplicate, delete

const { useState, useEffect, useRef } = React;

window.EditorPage = function EditorPage({ collection, itemId }) {
  const config = COLLECTIONS[collection];
  if (!config) return <div>Collection not found</div>;

  const isNew = !itemId;

  const emptyData = React.useMemo(() => {
    const empty = {};
    config.fields.forEach(f => { empty[f.key] = f.defaultValue != null ? f.defaultValue : ''; });
    return empty;
  }, [config]);

  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(!isNew);
  const initialDataRef = useRef(emptyData);

  useEffect(() => {
    if (isNew) {
      if (window.__DUPLICATE_PAYLOAD__) {
        const dupData = normalizeDataByFieldTypes(config.fields, { ...emptyData, ...window.__DUPLICATE_PAYLOAD__ });
        delete window.__DUPLICATE_PAYLOAD__;
        initialDataRef.current = emptyData;
        setData(dupData);
        setIsDirty(true);
        setIsDuplicateDraft(true);
        setTouchedFields({});
      } else {
        initialDataRef.current = emptyData;
        setData(emptyData);
        setIsDirty(false);
        setIsDuplicateDraft(false);
        setTouchedFields({});
      }
      return;
    }

    if (!itemId) return;
    api.get(collection + '/' + itemId).then(item => {
      const normalizedItem = normalizeDataByFieldTypes(config.fields, item);
      initialDataRef.current = normalizedItem;
      setData(normalizedItem);
      setIsDirty(false);
      setIsDuplicateDraft(false);
      setTouchedFields({});
      setLoading(false);
    });
  }, [collection, emptyData, isNew, itemId]);

  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});
  const [uploadState, setUploadState] = useState({});
  const [isDuplicateDraft, setIsDuplicateDraft] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [referenceOptions, setReferenceOptions] = useState({});
  const [devTab, setDevTab] = useState('schema');
  const [revisions, setRevisions] = useState([]);
  const [restorePreview, setRestorePreview] = useState(null);
  const [visibleRevisionCount, setVisibleRevisionCount] = useState(INITIAL_VISIBLE_REVISIONS);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const siteDir = localStorage.getItem('site_dir_' + user.site_id) || 'ltr';
  const domain = window.getSiteDomain(user.site_id || getSiteId());

  function getFieldValidationError(field, value) {
    const normalizedText = typeof value === 'string' ? value.trim() : String(value == null ? '' : value).trim();
    const hasRequiredValue = typeof value === 'boolean' ? true : !!normalizedText;

    if (field.required && !hasRequiredValue) {
      return field.label + ' - is required';
    }
    if ((field.type === 'link' || field.type === 'url') && normalizedText && !isValidLinkValue(normalizedText)) {
      return field.label + ' - Enter a valid link';
    }
    if (field.type === 'email' && normalizedText && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedText)) {
      return field.label + ' - Enter a valid email address';
    }
    if (field.type === 'number' && normalizedText) {
      var numVal = Number(normalizedText);
      if (isNaN(numVal)) return field.label + ' - Enter a valid number';
      if (field.min != null && numVal < field.min) return field.label + ' - Minimum value is ' + field.min;
      if (field.max != null && numVal > field.max) return field.label + ' - Maximum value is ' + field.max;
    }
    if (field.type === 'video' && normalizedText && !isValidLinkValue(normalizedText)) {
      return field.label + ' - Enter a valid video URL';
    }
    return '';
  }

  function isInlineValidationMessage(field, message) {
    if (!message) return false;
    return message === (field.label + ' - is required') || message === (field.label + ' - Enter a valid link') || message === (field.label + ' - Enter a valid email address') || message === (field.label + ' - Enter a valid number') || (message && message.indexOf(field.label + ' - Minimum value') === 0) || (message && message.indexOf(field.label + ' - Maximum value') === 0) || message === (field.label + ' - Enter a valid video URL');
  }

  useEffect(() => {
    const referenceFields = config.fields.filter(field => field.type === 'reference' && field.sourceCollection);

    if (!referenceFields.length) {
      setReferenceOptions({});
      return;
    }

    let active = true;
    Promise.all(referenceFields.map(field => (
      api.get(field.sourceCollection).then(items => [field.sourceCollection, items])
    )))
      .then(entries => {
        if (!active) return;
        setReferenceOptions(entries.reduce((acc, entry) => {
          acc[entry[0]] = entry[1];
          return acc;
        }, {}));
      })
      .catch(() => {
        if (!active) return;
        setReferenceOptions({});
      });

    return () => {
      active = false;
    };
  }, [config.fields]);

  useEffect(() => {
    setRevisions(readRevisions(collection, itemId));
    setVisibleRevisionCount(INITIAL_VISIBLE_REVISIONS);
  }, [collection, itemId]);

  useEffect(() => {
    const touchedKeys = Object.keys(touchedFields).filter(key => touchedFields[key]);
    if (!touchedKeys.length) return;

    setErrors(prev => {
      const next = { ...prev };
      touchedKeys.forEach(key => {
        const field = config.fields.find(f => f.key === key);
        if (!field) return;
        const msg = getFieldValidationError(field, data[key]);
        if (msg) {
          next[key] = msg;
        } else if (isInlineValidationMessage(field, next[key])) {
          delete next[key];
        }
      });
      return next;
    });
  }, [data, touchedFields, config.fields]);

  function handleFieldBlur(key) {
    setTouchedFields(prev => ({ ...prev, [key]: true }));
  }

  // Warn user before closing browser tab/window if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Register global hash navigation guard used by App router
  useEffect(() => {
    window.__EDITOR_UNSAVED_GUARD__ = () => {
      if (!isDirty) return true;
      return window.confirm('Your changes will not be saved. Are you sure you want to leave this page?');
    };

    return () => {
      if (window.__EDITOR_UNSAVED_GUARD__) {
        delete window.__EDITOR_UNSAVED_GUARD__;
      }
    };
  }, [isDirty]);

  function updateField(key, value) {
    setData(prev => {
      const next = { ...prev, [key]: value };
      const currentField = config.fields.find(f => f.key === key);

      if (currentField && currentField.type === 'reference') {
        const options = referenceOptions[currentField.sourceCollection] || [];
        const labelKey = currentField.labelKey || 'name';
        const selected = options.find(option => option.id === value);
        if (currentField.mirrorKey) {
          next[currentField.mirrorKey] = selected ? (selected[labelKey] || '') : '';
        }
      }

      const slugField = config.fields.find(f => f.type === 'slug' && f.autoFrom === key);
      if (slugField && isNew && !slugField.disabled) {
        next[slugField.key] = value
          .toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      setIsDirty(JSON.stringify(next) !== JSON.stringify(initialDataRef.current));
      return next;
    });
  }

  function handleSave() {
    if (!isNew && !isDirty) {
      setErrors({});
      setSaveError('');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
      return;
    }

    setTouchedFields(config.fields.reduce((acc, field) => {
      acc[field.key] = true;
      return acc;
    }, {}));

    const newErrors = {};
    config.fields.forEach(f => {
      const msg = getFieldValidationError(f, data[f.key]);
      if (msg) newErrors[f.key] = msg;
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    const slugField = config.fields.find(f => f.type === 'slug');
    const slugValue = slugField && (data[slugField.key] || '').trim();
    const initialSlugValue = slugField && (initialDataRef.current && initialDataRef.current[slugField.key] ? String(initialDataRef.current[slugField.key]).trim() : '');
    const shouldValidateSlugUniqueness = !!(slugField && slugValue && (isNew || slugValue !== initialSlugValue));

    if (shouldValidateSlugUniqueness) {
      setSaveState('saving');
      api.get(collection).then(items => {
        const currentId = String(itemId || data.id || initialDataRef.current.id || '');
        const duplicate = items.find(item => {
          const itemSlug = String(item[slugField.key] || '').trim();
          const itemIdValue = String(item.id || '');
          return itemSlug === slugValue && itemIdValue !== currentId;
        });
        if (duplicate) {
          setSaveState('idle');
          setErrors({ [slugField.key]: slugField.label + ' - "' + slugValue + '" already exists' });
          return;
        }
        doSave();
      }).catch(() => doSave());
    } else {
      doSave();
    }

    function doSave() {
    setErrors({});
    setSaveError('');
    setSaveState('saving');

    const normalizedSaveData = normalizeDataByFieldTypes(config.fields, data);
    Promise.resolve()
      .then(async () => {
        const preparedData = { ...normalizedSaveData };
        const richtextFields = config.fields.filter(function(f) { return f.type === 'richtext'; });
        for (let ri = 0; ri < richtextFields.length; ri++) {
          const rtKey = richtextFields[ri].key;
          if (typeof preparedData[rtKey] === 'string' && preparedData[rtKey].indexOf('data:image/') !== -1) {
            preparedData[rtKey] = await replaceInlineContentImagesWithCloudinary(preparedData[rtKey], collection);
          }
        }
        return preparedData;
      })
      .then(preparedData => {
        const promise = isNew
          ? api.post(collection, preparedData)
          : api.put(collection + '/' + itemId, preparedData);

        if (!isNew && itemId && initialDataRef.current && isDirty) {
          const nextRevisions = pushRevision(collection, itemId, initialDataRef.current, preparedData, config.fields);
          setRevisions(nextRevisions);
        }

        return promise;
      })
      .then(saved => {
      initialDataRef.current = saved;
      setData(saved);
      setSaveState('saved');
      setIsDirty(false);
      if (isNew && saved.id) {
        incrementCollectionCount(collection, 1);
        if (isDuplicateDraft) {
          const savedTitle = saved[config.list.title] || config.singular;
          window.showToast('"' + savedTitle + '" duplicated successfully', 'success');
          setTimeout(() => window.showToast('Slug was auto-generated — update it to avoid a 404 on the live site', 'warning'), 600);
        } else {
          window.showToast('Item created successfully', 'success');
        }
        // Navigate to edit mode with the new ID
        window.location.hash = '#/' + collection + '/edit/' + saved.id;
      }
      setIsDuplicateDraft(false);
      setTimeout(() => setSaveState('idle'), 2000);
    }).catch(error => {
      setSaveState('idle');
      setSaveError(error && error.message ? error.message : 'Save failed.');
    });
    } // end doSave
  }

  function handleDuplicateCurrent() {
    if (!window.confirm('Duplicate this ' + config.singular.toLowerCase() + '?')) return;
    window.__DUPLICATE_PAYLOAD__ = buildDuplicatePayload(config, data);
    window.location.hash = '#/' + collection + '/new';
  }

  function handleDeleteCurrent() {
    if (!itemId) return;
    if (!window.showConfirm('Delete this ' + config.singular.toLowerCase() + '?')) return;

    api.del(collection + '/' + itemId)
      .then(() => {
        const deletedItemTitle = data[config.list.title] || config.singular;
        setIsDirty(false);
        incrementCollectionCount(collection, -1);
        window.showToast('"' + deletedItemTitle + '" deleted', 'success');
        window.location.hash = '#/' + collection;
      })
      .catch(error => {
        window.showAlert(error && error.message ? error.message : 'Delete failed.');
      });
  }

  function handleRestoreRevision(entry, restoreLabel) {
    if (!entry || !entry.data || !itemId) return;

    const previewData = JSON.parse(JSON.stringify(entry.data));
    setRestorePreview(prev => ({
      entry,
      label: restoreLabel || 'Restore preview',
      originalData: prev ? prev.originalData : JSON.parse(JSON.stringify(data)),
      originalIsDirty: prev ? prev.originalIsDirty : isDirty,
    }));
    setSaveError('');
    setErrors({});
    setData(previewData);
    setIsDirty(JSON.stringify(previewData) !== JSON.stringify(initialDataRef.current));
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function handleCancelRestorePreview() {
    if (!restorePreview) return;
    setData(restorePreview.originalData);
    setIsDirty(restorePreview.originalIsDirty);
    setSaveError('');
    setRestorePreview(null);
  }

  function handleApplyRestorePreview() {
    if (!restorePreview || !restorePreview.entry || !restorePreview.entry.data || !itemId) return;

    setSaveState('saving');

    if (initialDataRef.current) {
      const nextRevisions = pushRevision(collection, itemId, initialDataRef.current, restorePreview.entry.data, config.fields);
      setRevisions(nextRevisions);
    }

    api.put(collection + '/' + itemId, restorePreview.entry.data).then(saved => {
      initialDataRef.current = saved;
      setData(saved);
      setIsDirty(false);
      setRestorePreview(null);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }).catch(error => {
      setSaveState('idle');
      setSaveError(error && error.message ? error.message : 'Restore failed.');
    });
  }

  // Breadcrumb title
  const titleField = config.fields.find(f => f.type === 'title');
  const itemTitle = (titleField && data[titleField.key]) || ('New ' + config.singular);

  // "View on site" link
  const slugField = config.fields.find(f => f.type === 'slug');
  const slugValue = slugField ? data[slugField.key] : null;
  const slugPrefix = slugField ? slugField.prefix : '';

  const saveBtnLabel = saveState === 'saving'
    ? (isDuplicateDraft && isNew ? 'Saving duplicate...' : 'Saving...')
    : saveState === 'saved'
      ? '✓ Saved'
      : (isDuplicateDraft && isNew ? 'Save duplicate' : (isDirty ? 'Save changes' : 'Save'));

  const saveBtnBg = saveState === 'saved' ? '#16a34a' : '#2563eb';
  const isRestorePreviewing = !!restorePreview;
  const cancelBtnLabel = isRestorePreviewing ? 'Back to current' : 'Back';
  const visibleRevisions = revisions.slice(0, visibleRevisionCount);
  const hasMoreRevisions = revisions.length > visibleRevisionCount;
  const rawSchema = (window.COLLECTION_SCHEMAS && window.COLLECTION_SCHEMAS[collection]) || null;
  const schemaPreview = {
    key: config.key,
    label: config.label,
    singular: config.singular,
    hasSinglePage: config.hasSinglePage,
    slugPrefix: rawSchema ? rawSchema.slugPrefix : '',
    navGroup: config.navGroup,
    metadataNote: config.metadataNote,
    fields: config.fields.map((field, index) => ({
      order: index + 1,
      key: field.key,
      label: field.label,
      type: field.type,
      required: !!field.required,
      half: !!field.half,
      sourceCollection: field.sourceCollection || null,
      mirrorKey: field.mirrorKey || null,
      previewMode: field.previewMode || null,
      disabled: !!field.disabled,
    })),
  };
  const itemJsonPreview = {
    collection,
    itemId: itemId || null,
    mode: isNew ? 'new' : 'edit',
    values: data,
  };
  const restoreChangedFields = isRestorePreviewing
    ? new Set(
        config.fields
          .filter(field => !areFieldValuesEqual((restorePreview.originalData || {})[field.key], data[field.key]))
          .map(field => field.key)
      )
    : null;
  const restorePreviewLabel = saveState === 'saving' ? 'Restoring...'
    : saveState === 'saved' ? '✓ Restored'
    : 'Apply restore';
  const duplicateValidationErrorCount = isDuplicateDraft && isNew
    ? config.fields.reduce((count, field) => {
        const msg = getFieldValidationError(field, data[field.key]);
        return msg ? count + 1 : count;
      }, 0)
    : 0;
  const isDuplicateSaveBlocked = isDuplicateDraft && isNew && duplicateValidationErrorCount > 0;
  const isSaveDisabled = saveState === 'saving' || (isRestorePreviewing ? false : isDuplicateSaveBlocked);

  function handleCancel() {
    if (isDirty && !window.confirm('Your changes will not be saved. Are you sure you want to discard them?')) return;
    setIsDirty(false);
    window.location.hash = '#/' + collection;
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSaveShortcut) return;

      event.preventDefault();
      if (saveState === 'saving') return;
      handleSave();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, saveState]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <BackendWarning />

      {/* Validation errors banner */}
      {Object.keys(errors).length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.875rem' }}>
          <p style={{ color: '#991b1b', fontWeight: 500, marginBottom: '0.5rem' }}>
            {Object.keys(errors).length === 1 ? 'Fix this error:' : 'Fix these errors:'}
          </p>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '1.25rem' }}>
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key} style={{ marginBottom: '0.25rem' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {isRestorePreviewing && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '0.75rem', padding: '1rem' }}>
          <p style={{ color: '#c2410c', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            {restorePreview.label}
          </p>
          <p style={{ color: '#c2410c', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Previewing a previous version from {formatIsraelDateTime(restorePreview.entry.createdAt)}
          </p>
          <p style={{ color: '#9a3412', fontSize: '0.8125rem', margin: 0 }}>
            The old values are loaded into the form, but nothing has been restored yet. Review the fields, then choose Apply restore or Back to current.
          </p>
        </div>
      )}

      {isDuplicateDraft && !isRestorePreviewing && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.85rem 1rem' }}>
          <p style={{ color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Duplicate draft - save required
          </p>
          <p style={{ color: '#1e3a8a', fontSize: '0.82rem', margin: 0 }}>
            This is still a duplicate draft. The new item will be created only after Save.
            {' '}
            <span style={{ color: isDuplicateSaveBlocked ? '#b45309' : '#166534', fontWeight: 600 }}>
              {isDuplicateSaveBlocked ? ('Complete ' + duplicateValidationErrorCount + ' required field' + (duplicateValidationErrorCount === 1 ? '' : 's')) : 'Ready to save'}
            </span>
          </p>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={isRestorePreviewing ? handleCancelRestorePreview : handleCancel}
          className="uk-button uk-button-secondary"
        >
          {!isRestorePreviewing && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', height: '1rem', borderRadius: '9999px', border: '1px solid #cbd5e1', fontSize: '0.65rem', marginRight: '0.35rem', lineHeight: 1 }}>
              X
            </span>
          )}
          {cancelBtnLabel}
        </button>
        <button
          onClick={isRestorePreviewing ? handleApplyRestorePreview : handleSave}
          disabled={isSaveDisabled}
          style={{
            backgroundColor: isSaveDisabled ? '#9ca3af' : saveBtnBg, color: '#fff', padding: '0.5rem 1rem',
            fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem',
            border: 'none', cursor: isSaveDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s',
            opacity: isSaveDisabled ? 0.88 : 1,
          }}
        >
          {isDirty && saveState === 'idle' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
          )}
          {isRestorePreviewing ? restorePreviewLabel : saveBtnLabel}
        </button>
      </div>

      {saveError && (
        <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{saveError}</p>
      )}

      {/* Fields */}
      {renderFields(config.fields, data, errors, siteDir, updateField, handleFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, restoreChangedFields, isNew ? null : initialDataRef.current)}

      {/* Bottom action bar */}
      <div className="uk-editor-actions-bottom">
        <button
          onClick={isRestorePreviewing ? handleCancelRestorePreview : handleCancel}
          className="uk-button uk-button-secondary"
        >
          {!isRestorePreviewing && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', height: '1rem', borderRadius: '9999px', border: '1px solid #cbd5e1', fontSize: '0.65rem', marginRight: '0.35rem', lineHeight: 1 }}>
              X
            </span>
          )}
          {cancelBtnLabel}
        </button>
        <button
          onClick={isRestorePreviewing ? handleApplyRestorePreview : handleSave}
          disabled={isSaveDisabled}
          style={{
            backgroundColor: isSaveDisabled ? '#9ca3af' : saveBtnBg, color: '#fff', padding: '0.5rem 1rem',
            fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem',
            border: 'none', cursor: isSaveDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s',
            opacity: isSaveDisabled ? 0.88 : 1,
          }}
        >
          {isDirty && saveState === 'idle' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
          )}
          {isRestorePreviewing ? restorePreviewLabel : saveBtnLabel}
        </button>
      </div>

      <div className="uk-section-xxs" style={{ display: 'grid', gap: '0.8rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Created</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatIsraelDateTime(data.created_at)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Last edited</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatIsraelDateTime(data.updated_at || data.created_at)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Metadata</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem', lineHeight: 1.5 }}>{config.metadataNote}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: config.hasSinglePage ? '#16a34a' : '#b91c1c' }}>
            <span style={{ width: 6, height: 6, borderRadius: '9999px', background: config.hasSinglePage ? '#22c55e' : '#ef4444' }} />
            <span>{config.hasSinglePage ? 'Includes single page' : 'List only, no single page'}</span>
          </div>

          <details style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.75rem 0.85rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <OutlineIcon name={window.UI_ICON_MAP.developerDebug} />
                <span>Developer debug</span>
              </span>
              <span style={{ marginLeft: '0.45rem', fontWeight: 400, color: '#94a3b8' }}>Schema + item JSON</span>
            </summary>
            <div style={{ padding: '0 0.85rem 0.85rem', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.75rem 0 0.65rem' }}>
                Development helper. Inspect field keys, order, and the current values loaded in this editor.
              </p>

              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setDevTab('schema')}
                  className="uk-button uk-button-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.72rem',
                    borderColor: devTab === 'schema' ? '#cbd5e1' : '#e5e7eb',
                    background: devTab === 'schema' ? '#f8fafc' : '#fff',
                    color: devTab === 'schema' ? '#0f172a' : '#64748b',
                  }}
                >
                  Schema
                </button>
                <button
                  type="button"
                  onClick={() => setDevTab('json')}
                  className="uk-button uk-button-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.72rem',
                    borderColor: devTab === 'json' ? '#cbd5e1' : '#e5e7eb',
                    background: devTab === 'json' ? '#f8fafc' : '#fff',
                    color: devTab === 'json' ? '#0f172a' : '#64748b',
                  }}
                >
                  Item JSON
                </button>
              </div>

              {devTab === 'schema' ? (
                <pre style={{ margin: 0, padding: '0.8rem', background: '#0f172a', color: '#dbeafe', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {JSON.stringify(schemaPreview, null, 2)}
                </pre>
              ) : (
                <pre style={{ margin: 0, padding: '0.8rem', background: '#0f172a', color: '#fde68a', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {JSON.stringify(itemJsonPreview, null, 2)}
                </pre>
              )}
            </div>
          </details>
        </div>
        {!isNew && (
          <div className="uk-divider" />
        )}
        {!isNew && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Actions</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleDuplicateCurrent}
                className="uk-button uk-button-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.7rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '12px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span>Duplicate</span>
              </button>

              <button
                onClick={handleDeleteCurrent}
                className="uk-button-delete"
                style={{ padding: '0.35rem 0.7rem', fontSize: '12px' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
        {!isNew && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>History</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.6rem' }}>Load an older version into the form first, review it, then choose whether to restore it.</p>
            {!revisions.length ? (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No previous versions yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Version</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Changes</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', width: '110px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRevisions.map((entry, idx) => {
                      const changesSummary = Array.isArray(entry.changedKeys) ? entry.changedKeys : [];
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          <td style={{ padding: '0.5rem', color: '#6b7280' }}>
                            <div style={{ display: 'grid', gap: '0.18rem' }}>
                              <span style={{ fontWeight: 600, color: '#c2410c' }}>Restore #{idx + 1}</span>
                              <span>{formatIsraelDateTime(entry.createdAt)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem', color: '#6b7280' }}>
                            {changesSummary.length > 0 ? changesSummary.join(', ') : 'unknown'}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRestoreRevision(entry, 'Restore #' + (idx + 1))}
                              className="uk-button uk-button-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                            >
                              Preview restore
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {hasMoreRevisions && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setVisibleRevisionCount(prev => prev + LOAD_MORE_REVISIONS_STEP)}
                      className="uk-button uk-button-secondary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
