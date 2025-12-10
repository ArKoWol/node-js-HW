import { useState } from 'react';
import PropTypes from 'prop-types';
import './CommentSection.css';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';

function CommentSection({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  disabled,
}) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState({ content: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ content: '' });
  const [actionError, setActionError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, commentId: null });

  const handleNewCommentSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!newComment.content.trim()) {
      setFormError('Comment text is required');
      return;
    }

    setSubmitting(true);
    const result = await onAddComment({
      content: newComment.content.trim(),
    });
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Unable to add comment');
      return;
    }

    setNewComment({ content: '' });
  };

  const beginEdit = (comment) => {
    setEditingId(comment.id);
    setEditDraft({ content: comment.content });
    setActionError(null);
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditDraft({ content: '' });
  };

  const saveEdit = async () => {
    setActionError(null);
    if (!editDraft.content.trim()) {
      setActionError('Comment text is required');
      return;
    }
    setSubmitting(true);
    const result = await onUpdateComment(editingId, {
      content: editDraft.content.trim(),
    });
    setSubmitting(false);
    if (!result.success) {
      setActionError(result.error || 'Unable to update comment');
      return;
    }
    resetEditState();
  };

  const deleteComment = (commentId) => {
    setDeleteConfirm({ isOpen: true, commentId });
  };

  const confirmDeleteComment = async () => {
    const { commentId } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, commentId: null });
    setActionError(null);
    setDeletingId(commentId);
    const result = await onDeleteComment(commentId);
    setDeletingId(null);
    if (!result.success) {
      setActionError(result.error || 'Unable to delete comment');
    }
  };

  const cancelDeleteComment = () => {
    setDeleteConfirm({ isOpen: false, commentId: null });
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
                {comment.userId === user?.id && (
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
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <form className="new-comment-form" onSubmit={handleNewCommentSubmit}>
        <h4>Add a comment</h4>
        <div className="form-row">
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

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
      />
    </section>
  );
}

CommentSection.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      userId: PropTypes.string,
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

