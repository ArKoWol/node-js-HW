import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ArticleList.css';

function ArticleList({
  articles,
  loading,
  workspacesLoading,
  activeWorkspace,
  onArticleClick,
  onCreateNew,
  searchQuery,
  onSearchChange,
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (document.activeElement === searchInputRef.current) {
        return;
      }
    };

    const handleSubmit = (e) => {
      if (e.target.closest('.search-container')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const searchQueryRef = useRef(searchQuery);
  const onSearchChangeRef = useRef(onSearchChange);
  
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      
      if (activeElement === searchInputRef.current) {
        return;
      }

      const isInputFocused = 
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable ||
        activeElement.tagName === 'BUTTON';

      if (isInputFocused) {
        return;
      }

      const isPrintableKey = 
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key !== 'Enter' &&
        e.key !== 'Tab' &&
        e.key !== 'Escape' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowLeft' &&
        e.key !== 'ArrowRight' &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete';

      if (isPrintableKey && searchInputRef.current) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current.focus();
        const currentValue = searchQueryRef.current || '';
        const newValue = currentValue + e.key;
        onSearchChangeRef.current(newValue);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.setSelectionRange(newValue.length, newValue.length);
          }
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const workspaceTitle = activeWorkspace
    ? `${activeWorkspace.name} workspace`
    : 'All workspaces';

  return (
    <div 
      className="article-list-container"
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && 
            document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA' &&
            !document.activeElement.isContentEditable) {
          e.preventDefault();
        }
      }}
    >
      <div className="list-header">
        <div className="list-header-text">
          <p className="list-header-subtitle">{workspaceTitle}</p>
          <h2>Articles ({articles.length})</h2>
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          + Create New Article
        </button>
      </div>

      <div 
        className="search-container"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
          }
        }}
      >
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="Search articles by title or content... (or just start typing)"
          value={typeof searchQuery === 'string' ? searchQuery : ''}
          onChange={(e) => {
            try {
              const newValue = e.target.value;
              onSearchChange(newValue);
            } catch (error) {
              console.error('Error in search onChange:', error);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            if (e.key === 'Backspace' && !searchQuery && document.activeElement === searchInputRef.current) {
              e.preventDefault();
            }
          }}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSearchChange('');
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {loading && articles.length === 0 && !searchQuery ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          {searchQuery && searchQuery.trim().length > 0 ? (
            <>
              <div className="empty-icon">🔍</div>
              <h3>No articles match your search</h3>
              <p>Try a different search term or clear the search to see all articles.</p>
              {loading && (
                <div style={{ marginTop: '1rem', opacity: 0.7 }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
                </div>
              )}
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSearchChange('');
                  setTimeout(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }, 0);
                }}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <div className="empty-icon">📄</div>
              <h3>No articles yet</h3>
              <p>Create your first article to get started!</p>
              <button className="btn btn-primary" onClick={onCreateNew}>
                Create Article
              </button>
            </>
          )}
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
  searchQuery: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
};

ArticleList.defaultProps = {
  workspacesLoading: false,
  activeWorkspace: null,
  searchQuery: '',
};

export default ArticleList;

