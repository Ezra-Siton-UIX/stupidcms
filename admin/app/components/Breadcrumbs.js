// Breadcrumbs — breadcrumb navigation
// Simple breadcrumb navigation bar

const { Fragment } = React;

window.Breadcrumbs = function Breadcrumbs({ items }) {
  return (
    <nav className="uk-breadcrumbs" style={{ marginBottom: 0 }}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="uk-breadcrumb-sep">/</span>}
          {item.href
            ? <a href={item.href} className="uk-breadcrumb-link">{item.label}</a>
            : <span className="uk-breadcrumb-current">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
};
