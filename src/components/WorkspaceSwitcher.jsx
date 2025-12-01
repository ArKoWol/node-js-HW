import PropTypes from 'prop-types';
import './WorkspaceSwitcher.css';

function WorkspaceSwitcher({
  workspaces,
  loading,
  error,
  activeWorkspaceId,
  onSelect,
  onRefresh,
}) {
  const isEmptyState = !loading && workspaces.length === 0;

  return (
    <div className="workspace-switcher">
      <div className="workspace-switcher-header">
        <div>
          <p className="workspace-switcher-subtitle">Context</p>
          <h2>Workspaces</h2>
        </div>
        <button
          type="button"
          className="workspace-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh workspaces"
        >
          ↻
        </button>
      </div>
      {error && (
        <div className="workspace-switcher-error">
          {error}
        </div>
      )}
      <div className="workspace-switcher-list">
        {loading && workspaces.length === 0 && (
          <span className="workspace-switcher-placeholder">Loading workspaces...</span>
        )}
        {isEmptyState && (
          <span className="workspace-switcher-placeholder">No workspaces available</span>
        )}
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            className={`workspace-switcher-item ${workspace.id === activeWorkspaceId ? 'active' : ''}`}
            onClick={() => onSelect(workspace.id)}
          >
            <span className="workspace-switcher-name">{workspace.name}</span>
            <span className="workspace-switcher-count">
              {(workspace.articleCount ?? 0).toLocaleString()} articles
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

WorkspaceSwitcher.propTypes = {
  workspaces: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      articleCount: PropTypes.number,
    })
  ).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  activeWorkspaceId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

WorkspaceSwitcher.defaultProps = {
  loading: false,
  error: null,
  activeWorkspaceId: null,
};

export default WorkspaceSwitcher;

