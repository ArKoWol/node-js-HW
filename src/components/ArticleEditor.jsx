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

  useEffect(() => {
    if (article && isEdit) {
      setTitle(article.title || '');
      setContent(article.content || '');
      setAuthor(article.author || '');
    }
  }, [article, isEdit]);

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
    'bullet',
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
    }
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

