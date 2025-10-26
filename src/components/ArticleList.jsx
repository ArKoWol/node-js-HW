import PropTypes from 'prop-types';
import './ArticleList.css';

function ArticleList({ articles, loading, onArticleClick, onCreateNew }) {
  if (loading && articles.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="article-list-container">
      <div className="list-header">
        <h2>All Articles ({articles.length})</h2>
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
              <h3 className="article-title">{article.title}</h3>
              <p className="article-summary">{article.summary}</p>
              <div className="article-meta">
                <span className="article-date">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
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
  onArticleClick: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};

export default ArticleList;

