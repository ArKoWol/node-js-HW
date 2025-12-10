import PropTypes from 'prop-types';
import './ArticleView.css';
import CommentSection from './CommentSection';
import { useAuth } from '../contexts/AuthContext';

function ArticleView({
  article,
  loading,
  versionOverride,
  versionLoading,
  selectedVersionNumber,
  onVersionChange,
  onVersionReset,
  onEdit,
  onDelete,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}) {
  const { getAuthHeaders } = useAuth();
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

  const displayArticle = versionOverride
    ? { ...article, ...versionOverride }
    : article;

  const effectiveVersionNumber = versionOverride?.versionNumber || article.currentVersionNumber || 1;
  const selectValue = selectedVersionNumber ?? effectiveVersionNumber;
  const isViewingOldVersion = Boolean(
    versionOverride && versionOverride.versionNumber !== article.currentVersionNumber
  );
  const versionOptions = article.versions || [];

  const handleAttachmentClick = async (attachment) => {
    const API_URL = 'http://localhost:3000/api';
    try {
      const response = await fetch(`${API_URL}/articles/${article.id}/attachments/${attachment.id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up the object URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        alert('Failed to load attachment. Please try again.');
      }
    } catch (error) {
      console.error('Error loading attachment:', error);
      alert('Failed to load attachment. Please try again.');
    }
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

  const handleVersionSelect = (event) => {
    const selectedVersion = Number(event.target.value);
    if (!Number.isNaN(selectedVersion)) {
      onVersionChange(selectedVersion);
    }
  };

  return (
    <div className="article-view-container">
      <article className="article-content">
        <header className="article-header">
          <div className="article-header-top">
            <h1>{displayArticle.title}</h1>
            <div className="version-controls">
              <label htmlFor="versionSelect">Version</label>
              <select
                id="versionSelect"
                value={selectValue}
                onChange={handleVersionSelect}
                disabled={versionLoading || loading || versionOptions.length === 0}
              >
                {versionOptions.map((version) => (
                  <option key={version.id} value={version.versionNumber}>
                    {`Version ${version.versionNumber} • ${new Date(version.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`}
                  </option>
                ))}
              </select>
              {versionLoading && <span className="version-loading">Loading...</span>}
            </div>
          </div>
          {article.workspace && (
            <span className="workspace-badge">{article.workspace.name}</span>
          )}
          <div className="article-metadata">
            <span className="author">By {displayArticle.author}</span>
            <span className="separator">•</span>
            <span className="date">
              {new Date(displayArticle.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {displayArticle.updatedAt && displayArticle.updatedAt !== displayArticle.createdAt && (
            <div className="article-updated">
              Last updated:{' '}
              {new Date(displayArticle.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
          {isViewingOldVersion && (
            <div className="version-banner">
              <div>
                <strong>Read-only version</strong>
                <p>
                  Viewing version {effectiveVersionNumber} of {article.currentVersionNumber}. Editing is disabled.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={onVersionReset}
                disabled={versionLoading}
              >
                View latest
              </button>
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
          dangerouslySetInnerHTML={{ __html: displayArticle.content }}
        />
        <div className="article-actions">
          <button
            className="btn btn-primary"
            onClick={onEdit}
            disabled={loading || isViewingOldVersion}
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
        {isViewingOldVersion && (
          <p className="read-only-hint">
            Old versions are read-only. Switch back to the latest version to edit.
          </p>
        )}
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
    currentVersionNumber: PropTypes.number,
    versions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        versionNumber: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
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
  versionOverride: PropTypes.shape({
    versionNumber: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string,
  }),
  versionLoading: PropTypes.bool,
  selectedVersionNumber: PropTypes.number,
  onVersionChange: PropTypes.func.isRequired,
  onVersionReset: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
};

ArticleView.defaultProps = {
  article: null,
  versionOverride: null,
  versionLoading: false,
  selectedVersionNumber: null,
};

export default ArticleView;

