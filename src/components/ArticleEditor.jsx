import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './ArticleEditor.css';

function ArticleEditor({ onSubmit, onCancel, loading, article, isEdit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    if (article && isEdit) {
      setTitle(article.title || '');
      setContent(article.content || '');
      setAuthor(article.author || '');
      setAttachments(article.attachments || []);
    }
  }, [article, isEdit]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setPendingFiles([...pendingFiles, ...validFiles]);
    event.target.value = '';
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    if (!article || !article.id) {
      setUploadError('Please save the article before uploading attachments.');
      return;
    }

    setUploadingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`http://localhost:3000/api/articles/${article.id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setAttachments([...attachments, data.attachment]);
      event.target.value = '';
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/articles/${article.id}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete attachment');
      }

      setAttachments(attachments.filter((a) => a.id !== attachmentId));
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const getAttachmentIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '[IMG]';
    if (mimeType === 'application/pdf') return '[PDF]';
    return '[FILE]';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'color',
    'background',
    'link',
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!content.trim() || content === '<p><br></p>') {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || 'Anonymous',
    });

    setSubmitting(false);

    if (result.success) {
      setTitle('');
      setContent('');
      setAuthor('');
      setErrors({});

      if (pendingFiles.length > 0) {
        await uploadPendingFiles(result.articleId);
      }
    }
  };

  const uploadPendingFiles = async (articleId) => {
    for (const file of pendingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:3000/api/articles/${articleId}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error(`Failed to upload ${file.name}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
    setPendingFiles([]);
  };

  return (
    <div className="article-editor-container">
      <div className="editor-header">
        <h2>{isEdit ? 'Edit Article' : 'Create New Article'}</h2>
        <p>{isEdit ? 'Update the article details below' : 'Fill in the details below to create a new article'}</p>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title..."
            className={errors.title ? 'input-error' : ''}
            disabled={submitting || loading}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter author name (optional)..."
            disabled={submitting || loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">
            Content <span className="required">*</span>
          </label>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Write your article content..."
            className={errors.content ? 'editor-error' : ''}
            readOnly={submitting || loading}
          />
          {errors.content && <span className="error-text">{errors.content}</span>}
        </div>

        <div className="form-group">
          <label>Attachments</label>

          {uploadError && (
            <div className="upload-error">
              {uploadError}
              <button onClick={() => setUploadError(null)}>✕</button>
            </div>
          )}

          <div className="attachments-upload">
            <input
              type="file"
              id="file-upload"
              onChange={isEdit ? handleFileUpload : handleFileSelect}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
              disabled={uploadingFile || submitting || loading}
              style={{ display: 'none' }}
              multiple={!isEdit}
            />
            <label htmlFor="file-upload" className={`upload-button ${uploadingFile ? 'uploading' : ''}`}>
              {uploadingFile ? 'Uploading...' : 'Add File'}
            </label>
            <span className="upload-hint">Images (JPG, PNG, GIF, WEBP) and PDFs only, max 10MB</span>
          </div>

          {pendingFiles.length > 0 && (
            <div className="attachments-list-editor">
              <h4>Files to be attached:</h4>
              {pendingFiles.map((file, index) => (
                <div key={index} className="attachment-item-editor">
                  <div className="attachment-icon">{getAttachmentIcon(file.type)}</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{file.name}</div>
                    <div className="attachment-meta">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-delete-attachment"
                    onClick={() => removePendingFile(index)}
                    disabled={submitting || loading}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {isEdit && attachments.length > 0 && (
            <div className="attachments-list-editor">
              <h4>Current attachments:</h4>
              {attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-item-editor">
                  <div className="attachment-icon">{getAttachmentIcon(attachment.mimeType)}</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{attachment.filename}</div>
                    <div className="attachment-meta">{formatFileSize(attachment.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-delete-attachment"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    disabled={submitting || loading}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting || loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loading}
          >
            {submitting || loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Article' : 'Create Article')}
          </button>
        </div>
      </form>
    </div>
  );
}

ArticleEditor.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  article: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
    author: PropTypes.string,
  }),
  isEdit: PropTypes.bool,
};

export default ArticleEditor;

