// ListPage — collection list view
// Collection list view with trash, metadata, developer debug

const { useState, useEffect, Fragment } = React;

window.ListPage = function ListPage({ collection }) {
  const config = COLLECTIONS[collection];
  if (!config) return <div>Collection not found</div>;

  const [items, setItems] = useState([]);
  const [trashItems, setTrashItems] = useState(() => readTrashItems(collection));
  const [loading, setLoading] = useState(true);
  const [devTab, setDevTab] = useState('schema');
  const domain = window.getSiteDomain(getSiteId());
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
  const jsonPreviewItems = items.slice(0, 10);
  const hasMoreJsonItems = items.length > jsonPreviewItems.length;
  const sitemapPreview = buildCollectionSitemapPreview(config, collection, rawSchema, items, domain);
  const publicApiUrl = domain + '/api/public/' + getSiteId() + '/' + collection;

  useEffect(() => {
    setLoading(true);
    setTrashItems(readTrashItems(collection));
    api.get(collection).then(data => {
      setItems(data);
      updateCollectionCount(collection, data.length);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [collection]);

  function handleDelete(id, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this ' + config.singular.toLowerCase() + '?')) return;
    api.del(collection + '/' + id).then(() => {
      const deletedItemTitle = items.find(i => i.id === id)?.[config.list.title] || config.singular;
      setItems(prev => {
        const deletedItem = prev.find(i => i.id === id);
        const next = prev.filter(i => i.id !== id);
        updateCollectionCount(collection, next.length);
        if (deletedItem) {
          setTrashItems(pushTrashItem(collection, deletedItem, config));
        }
        return next;
      });
      window.showToast('"' + deletedItemTitle + '" moved to recycle bin', 'success');
    });
  }

  function handleRestoreTrash(entry, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!entry || !entry.item) return;

    if (!window.showConfirm('Restore "' + (entry.title || 'this item') + '"?\nThe item will be added back to the list.')) return;
    _doRestoreTrash(entry);
  }

  function _doRestoreTrash(entry) {
    const restorePayload = JSON.parse(JSON.stringify(entry.item));
    delete restorePayload.id;
    delete restorePayload.site_id;
    delete restorePayload.created_at;
    delete restorePayload.updated_at;
    delete restorePayload.createdAt;
    delete restorePayload.updatedAt;

    api.post(collection, restorePayload).then(saved => {
      setItems(prev => {
        const next = [saved].concat(prev);
        updateCollectionCount(collection, next.length);
        return next;
      });
      setTrashItems(removeTrashItem(collection, entry.trashId));
      window.showToast('"' + (entry.title || 'Item') + '" restored', 'success');
    }).catch(error => {
      window.showAlert(error && error.message ? error.message : 'Could not restore item.');
    });
  }

  function handleDeleteTrashForever(trashId, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this item permanently from local recycle bin?')) return;
    const target = trashItems.find(entry => entry.trashId === trashId);
    setTrashItems(removeTrashItem(collection, trashId));
    window.showToast('"' + (target && target.title ? target.title : 'Item') + '" deleted forever', 'success');
  }

  function handleEmptyTrash(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!trashItems.length) return;
    if (!window.confirm('Empty local recycle bin for ' + config.label + '?')) return;
    const removedCount = trashItems.length;
    writeTrashItems(collection, []);
    setTrashItems([]);
    window.showToast('Recycle bin emptied (' + removedCount + ' item' + (removedCount === 1 ? '' : 's') + ')', 'success');
  }

  function handleDuplicate(item, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Duplicate this ' + config.singular.toLowerCase() + '?')) return;
    window.__DUPLICATE_PAYLOAD__ = buildDuplicatePayload(config, item);
    window.location.hash = '#/' + collection + '/new';
  }

  return (
    <div>
      <BackendWarning />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-xl font-semibold text-gray-900" style={{ margin: 0 }}>{config.label}</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
            {loading ? 'Loading items...' : items.length + ' item' + (items.length === 1 ? '' : 's')}
          </p>
        </div>
        <a href={'#/' + collection + '/new'} className="uk-button uk-button-primary" style={{ textDecoration: 'none' }}>
          {config.newLabel}
        </a>
      </div>

      <div className="uk-list">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">{config.emptyMessage}</p>
        ) : items.map(item => {
          const title = item[config.list.title];
          const subtitle = config.list.subtitle(item);
          const image = config.list.image ? item[config.list.image] : null;
          const slug = config.list.slug ? item[config.list.slug] : null;
          const slugField = config.fields.find(f => f.key === config.list.slug);
          const slugPrefix = slugField ? slugField.prefix : '/';

          return (
            <a
              key={item.id}
              href={'#/' + collection + '/edit/' + item.id}
              className="group uk-card"
              style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              {image ? (
                <img src={image} alt="" className="uk-img-avatar" />
              ) : config.list.placeholder ? (
                <div className="uk-img-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '1.125rem', fontWeight: 600 }}>
                  {config.list.placeholder}
                </div>
              ) : null}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="uk-text-headline" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
                <p className="uk-text-meta">
                  {subtitle}
                  {slug && <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', color: '#d1d5db' }}>{slugPrefix}{slug}</span>}
                  {slug && domain && (
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(domain + slugPrefix + slug, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ marginLeft: '0.5rem', color: '#60a5fa', textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      title="View on site"
                    >↗</button>
                  )}
                </p>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button onClick={e => handleDuplicate(item, e)} className="uk-button uk-button-secondary" style={{ marginRight: '0.35rem', fontSize: '12px' }}>Duplicate</button>
                <button onClick={e => handleDelete(item.id, e)} className="uk-button-delete">Delete</button>
              </div>
            </a>
          );
        })}
      </div>

      {trashItems.length > 0 && <details style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <OutlineIcon name={window.UI_ICON_MAP.recycleBin} />
            <span>Recycle bin</span>
          </span>
          <span style={{ marginLeft: '0.45rem', fontWeight: 400, color: '#94a3b8' }}>{trashItems.length} item{trashItems.length === 1 ? '' : 's'}</span>
        </summary>
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.75rem 0 0.55rem' }}>
            Local only. Stored in this browser on this machine.
          </p>

          {trashItems.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Recycle bin is empty.</p>
          ) : (
            <Fragment>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {trashItems.map(entry => (
                  <div key={entry.trashId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.65rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Deleted {formatIsraelDateTime(entry.deletedAt)}</p>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button onClick={e => handleRestoreTrash(entry, e)} className="uk-button uk-button-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Restore</button>
                      <button onClick={e => handleDeleteTrashForever(entry.trashId, e)} className="uk-button-delete" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Delete forever</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleEmptyTrash} className="uk-button uk-button-secondary" style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                  Empty recycle bin
                </button>
              </div>
            </Fragment>
          )}
        </div>
      </details>}

      <div className="uk-section-xxs">
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          Metadata
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.35rem' }}>
          {config.metadataNote}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: config.hasSinglePage ? '#166534' : '#991b1b' }}>
          <span style={{ width: 8, height: 8, borderRadius: '9999px', background: config.hasSinglePage ? '#22c55e' : '#ef4444' }} />
          {config.hasSinglePage ? (
            <span>Published: includes single page</span>
          ) : (
            <span>
              List only, on{' '}
              {domain ? (
                <a
                  href={domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#991b1b', textDecoration: 'underline' }}
                >
                  live website
                </a>
              ) : (
                'live website'
              )}{' '}
              no single page
            </span>
          )}
        </div>

        <details style={{ marginTop: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <OutlineIcon name={window.UI_ICON_MAP.developerDebug} />
              <span>Developer debug</span>
            </span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8' }}>Schema + JSON sample</span>
          </summary>
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.85rem 0 0.5rem' }}>
              Development helper. JSON sample shows up to 10 items from the API response.
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              <span style={{ color: '#94a3b8', marginRight: '0.35rem' }}>GET</span>
              <a href={publicApiUrl} target="_blank" rel="noopener" style={{ color: '#3b82f6', textDecoration: 'none' }}>{publicApiUrl}</a>
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setDevTab('schema')}
                className="uk-button uk-button-secondary"
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.75rem',
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
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.75rem',
                  borderColor: devTab === 'json' ? '#cbd5e1' : '#e5e7eb',
                  background: devTab === 'json' ? '#f8fafc' : '#fff',
                  color: devTab === 'json' ? '#0f172a' : '#64748b',
                }}
              >
                JSON sample
              </button>
            </div>

            {devTab === 'schema' ? (
              <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#dbeafe', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
                {JSON.stringify(schemaPreview, null, 2)}
              </pre>
            ) : (
              <Fragment>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.55rem' }}>
                  Showing {jsonPreviewItems.length} of {items.length} item{items.length === 1 ? '' : 's'}{hasMoreJsonItems ? ' (limited to 10)' : ''}.
                </p>
                <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#fde68a', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
                  {JSON.stringify(jsonPreviewItems, null, 2)}
                </pre>
              </Fragment>
            )}
          </div>
        </details>

        <details style={{ marginTop: '0.85rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <OutlineIcon name={window.UI_ICON_MAP.sitemap} />
              <span>Sitemap preview</span>
            </span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8' }}>{sitemapPreview.entryCount} URL{sitemapPreview.entryCount === 1 ? '' : 's'}</span>
          </summary>
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.85rem 0 0.35rem' }}>
              Expected sitemap endpoint for this collection
            </p>
            <p style={{ fontSize: '0.75rem', color: '#0f172a', marginBottom: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {sitemapPreview.sitemapUrl}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.55rem' }}>
              XML preview generated from the current collection data.
            </p>
            <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#c4f1d4', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
              {sitemapPreview.xml}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};
