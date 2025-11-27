import PropTypes from 'prop-types';
import './ArticleList.css';

function ArticleList({
  articles,
  loading,
  workspacesLoading,
  activeWorkspace,
  onArticleClick,
  onCreateNew,
}) {
  if ((loading || workspacesLoading) && articles.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading articles...</p>
      </div>
    );
  }

  const workspaceTitle = activeWorkspace
    ? `${activeWorkspace.name} workspace`
    : 'All workspaces';

  return (
    <div className="article-list-container">
      <div className="list-header">
        <div className="list-header-text">
          <p className="list-header-subtitle">{workspaceTitle}</p>
          <h2>Articles ({articles.length})</h2>
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          + Create New Article
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No articles yet</h3>
          <p>Create your first article to get started!</p>
          <button className="btn btn-primary" onClick={onCreateNew}>
            Create Article
          </button>
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <div
              key={article.id}
              className="article-card"
              onClick={() => onArticleClick(article.id)}
            >
              <div className="article-card-top">
                {article.workspace && (
                  <span className="workspace-chip">{article.workspace.name}</span>
                )}
                <span className="article-date">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-summary">{article.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ArticleList.propTypes = {
  articles: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  workspacesLoading: PropTypes.bool,
  activeWorkspace: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onArticleClick: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};

ArticleList.defaultProps = {
  workspacesLoading: false,
  activeWorkspace: null,
};

export default ArticleList;

