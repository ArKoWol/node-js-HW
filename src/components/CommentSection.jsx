import { useState } from 'react';
import PropTypes from 'prop-types';
import './CommentSection.css';

function CommentSection({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  disabled,
}) {
  const [newComment, setNewComment] = useState({ author: '', content: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ author: '', content: '' });
  const [actionError, setActionError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleNewCommentSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!newComment.content.trim()) {
      setFormError('Comment text is required');
      return;
    }

    setSubmitting(true);
    const result = await onAddComment({
      author: newComment.author.trim(),
      content: newComment.content.trim(),
    });
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Unable to add comment');
      return;
    }

    setNewComment({ author: '', content: '' });
  };

  const beginEdit = (comment) => {
    setEditingId(comment.id);
    setEditDraft({ author: comment.author, content: comment.content });
    setActionError(null);
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditDraft({ author: '', content: '' });
  };

  const saveEdit = async () => {
    setActionError(null);
    if (!editDraft.content.trim()) {
      setActionError('Comment text is required');
      return;
    }
    setSubmitting(true);
    const result = await onUpdateComment(editingId, {
      author: editDraft.author.trim(),
      content: editDraft.content.trim(),
    });
    setSubmitting(false);
    if (!result.success) {
      setActionError(result.error || 'Unable to update comment');
      return;
    }
    resetEditState();
  };

  const deleteComment = async (commentId) => {
    setActionError(null);
    if (!window.confirm('Delete this comment?')) {
      return;
    }
    setDeletingId(commentId);
    const result = await onDeleteComment(commentId);
    setDeletingId(null);
    if (!result.success) {
      setActionError(result.error || 'Unable to delete comment');
    }
  };

  return (
    <section className="comment-section">
      <header className="comment-section-header">
        <div>
          <p className="comment-section-subtitle">Feedback</p>
          <h3>Comments ({comments.length})</h3>
        </div>
      </header>

      {actionError && (
        <div className="comment-error-banner">
          {actionError}
          <button type="button" onClick={() => setActionError(null)}>
            ✕
          </button>
        </div>
      )}

      {comments.length === 0 && (
        <div className="comment-empty-state">
          <p>No comments yet. Start the discussion!</p>
        </div>
      )}

      <div className="comment-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            {editingId === comment.id ? (
              <div className="comment-edit-form">
                <input
                  type="text"
                  placeholder="Author"
                  value={editDraft.author}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, author: event.target.value })
                  }
                  disabled={submitting || disabled}
                />
                <textarea
                  rows="3"
                  value={editDraft.content}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, content: event.target.value })
                  }
                  disabled={submitting || disabled}
                />
                <div className="comment-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetEditState}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveEdit}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="comment-item-header">
                  <strong>{comment.author}</strong>
                  <span>
                    {new Date(comment.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="comment-item-body">{comment.content}</p>
                <div className="comment-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => beginEdit(comment)}
                    disabled={disabled}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteComment(comment.id)}
                    disabled={disabled || deletingId === comment.id}
                  >
                    {deletingId === comment.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="new-comment-form" onSubmit={handleNewCommentSubmit}>
        <h4>Add a comment</h4>
        <div className="form-row">
          <input
            type="text"
            placeholder="Name (optional)"
            value={newComment.author}
            onChange={(event) =>
              setNewComment({ ...newComment, author: event.target.value })
            }
            disabled={submitting || disabled}
          />
          <textarea
            rows="3"
            placeholder="Share your thoughts..."
            value={newComment.content}
            onChange={(event) =>
              setNewComment({ ...newComment, content: event.target.value })
            }
            disabled={submitting || disabled}
          />
        </div>
        {formError && <span className="comment-error">{formError}</span>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || disabled}
        >
          {submitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </section>
  );
}

CommentSection.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAddComment: PropTypes.func.isRequired,
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

CommentSection.defaultProps = {
  disabled: false,
};

export default CommentSection;

