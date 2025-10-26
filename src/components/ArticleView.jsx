import PropTypes from 'prop-types';
import './ArticleView.css';

function ArticleView({ article, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="error-container">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="article-view-container">
      <article className="article-content">
        <header className="article-header">
          <h1>{article.title}</h1>
          <div className="article-metadata">
            <span className="author">By {article.author}</span>
            <span className="separator">•</span>
            <span className="date">
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </header>
        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}

ArticleView.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool.isRequired,
};

export default ArticleView;

