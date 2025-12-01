import PropTypes from 'prop-types';
import './ArticleView.css';
import CommentSection from './CommentSection';

function ArticleView({ article, loading, onEdit, onDelete, onAddComment, onUpdateComment, onDeleteComment }) {
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

  const handleAttachmentClick = (attachment) => {
    const API_URL = 'http://localhost:3000/api';
    const url = `${API_URL}/articles/${article.id}/attachments/${attachment.id}`;
    window.open(url, '_blank');
  };

  const getAttachmentIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return '[IMG]';
    } else if (mimeType === 'application/pdf') {
      return '[PDF]';
    }
    return '[FILE]';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="article-view-container">
      <article className="article-content">
        <header className="article-header">
          <h1>{article.title}</h1>
          {article.workspace && (
            <span className="workspace-badge">{article.workspace.name}</span>
          )}
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
          {article.updatedAt && article.updatedAt !== article.createdAt && (
            <div className="article-updated">
              Last updated: {new Date(article.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </header>

        {article.attachments && article.attachments.length > 0 && (
          <div className="attachments-section">
            <h3 className="attachments-title">
              Attachments ({article.attachments.length})
            </h3>
            <div className="attachments-list">
              {article.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="attachment-item"
                  onClick={() => handleAttachmentClick(attachment)}
                >
                  <div className="attachment-icon">
                    {getAttachmentIcon(attachment.mimeType)}
                  </div>
                  <div className="attachment-info">
                    <div className="attachment-name">{attachment.filename}</div>
                    <div className="attachment-meta">
                      {formatFileSize(attachment.size)}
                    </div>
                  </div>
                  <div className="attachment-action">View</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <div className="article-actions">
          <button 
            className="btn btn-primary" 
            onClick={onEdit}
            disabled={loading}
          >
            Edit Article
          </button>
          <button 
            className="btn btn-danger" 
            onClick={() => onDelete(article.id)}
            disabled={loading}
          >
            Delete Article
          </button>
        </div>
        <CommentSection
          comments={article.comments || []}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          disabled={loading}
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
    updatedAt: PropTypes.string,
    workspace: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
  }),
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
};

export default ArticleView;

