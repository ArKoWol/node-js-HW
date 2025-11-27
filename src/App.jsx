import { useState, useEffect, useCallback } from 'react';
import './App.css';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleEditor from './components/ArticleEditor';
import NotificationDisplay from './components/NotificationDisplay';
import { useWebSocket } from './hooks/useWebSocket';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [view, setView] = useState('list');
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspacesError, setWorkspacesError] = useState(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  const fetchWorkspaces = useCallback(async () => {
    setWorkspacesLoading(true);
    setWorkspacesError(null);
    try {
      const response = await fetch(`${API_URL}/workspaces`);
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
      if (data.workspaces?.length) {
        setActiveWorkspaceId((prev) => prev || data.workspaces[0].id);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setWorkspacesError(err.message);
    } finally {
      setWorkspacesLoading(false);
    }
  }, []);

  const fetchArticles = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/articles?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      setArticles([]);
      fetchArticles(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchArticles]);

  const handleWebSocketMessage = (data) => {
    const notification = {
      id: Date.now(),
      type: data.type,
      message: data.message,
      timestamp: data.timestamp,
    };
    
    setNotifications((prev) => [notification, ...prev].slice(0, 5));

    if (data.type !== 'connection' && view === 'list') {
      fetchArticles(activeWorkspaceId);
      fetchWorkspaces();
    }
    
    if ((data.type === 'article_updated' || data.type === 'file_attached' || data.type === 'file_deleted') 
        && selectedArticle && data.articleId === selectedArticle.id) {
      handleArticleClick(data.articleId);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const handleArticleClick = async (articleId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      const data = await response.json();
      setSelectedArticle(data.article);
      setView('view');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (articleData) => {
    setLoading(true);
    setError(null);
    try {
      const workspaceId = articleData.workspaceId || activeWorkspaceId;
      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...articleData, workspaceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to create article');
      }

      await fetchArticles(workspaceId);
      await fetchWorkspaces();
      setView('list');
      return { success: true, articleId: data.article.id };
    } catch (err) {
      setError(err.message);
      console.error('Error creating article:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleEditArticle = async (articleId, articleData) => {
    setLoading(true);
    setError(null);
    try {
      const workspaceId = articleData.workspaceId || activeWorkspaceId;
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...articleData, workspaceId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to update article');
      }

      await fetchArticles(workspaceId);
      await fetchWorkspaces();
      setSelectedArticle(data.article);
      setView('view');
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error updating article:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }

      await fetchArticles(activeWorkspaceId);
      await fetchWorkspaces();
      setView('list');
      setSelectedArticle(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedArticle(null);
    setError(null);
  };

  const handleCreateNew = () => {
    setView('create');
    setError(null);
  };

  const handleEditMode = () => {
    setView('edit');
    setError(null);
  };

  const handleAddComment = async (articleId, commentData) => {
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to add comment');
      }
      setSelectedArticle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [data.comment, ...(prev.comments || [])]
        };
      });
      return { success: true, comment: data.comment };
    } catch (err) {
      console.error('Error creating comment:', err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateComment = async (articleId, commentId, commentData) => {
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to update comment');
      }
      setSelectedArticle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: (prev.comments || []).map((comment) =>
            comment.id === commentId ? data.comment : comment
          )
        };
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating comment:', err);
      return { success: false, error: err.message };
    }
  };

  const handleDeleteComment = async (articleId, commentId) => {
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }
      setSelectedArticle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: (prev.comments || []).filter((comment) => comment.id !== commentId)
        };
      });
      return { success: true };
    } catch (err) {
      console.error('Error deleting comment:', err);
      return { success: false, error: err.message };
    }
  };

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Article Management System</h1>
          <div className="header-actions">
            <div className={`websocket-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-indicator"></span>
              {isConnected ? 'Live' : 'Offline'}
            </div>
            {view !== 'list' && (
              <button className="btn btn-secondary" onClick={handleBackToList}>
                ← Back to List
              </button>
            )}
          </div>
        </div>
        <WorkspaceSwitcher
          workspaces={workspaces}
          loading={workspacesLoading}
          error={workspacesError}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={(workspaceId) => {
            setActiveWorkspaceId(workspaceId);
            setSelectedArticle(null);
            setView('list');
          }}
          onRefresh={fetchWorkspaces}
        />
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {view === 'list' && (
          <ArticleList
            articles={articles}
            loading={loading}
            workspacesLoading={workspacesLoading}
            activeWorkspace={activeWorkspace}
            onArticleClick={handleArticleClick}
            onCreateNew={handleCreateNew}
          />
        )}

        {view === 'view' && selectedArticle && (
          <ArticleView
            article={selectedArticle}
            loading={loading}
            onEdit={handleEditMode}
            onDelete={handleDeleteArticle}
            onAddComment={(commentData) => handleAddComment(selectedArticle.id, commentData)}
            onUpdateComment={(commentId, commentData) =>
              handleUpdateComment(selectedArticle.id, commentId, commentData)
            }
            onDeleteComment={(commentId) => handleDeleteComment(selectedArticle.id, commentId)}
          />
        )}

        {view === 'create' && (
          <ArticleEditor
            onSubmit={handleCreateArticle}
            onCancel={handleBackToList}
            loading={loading}
            workspaces={workspaces}
            defaultWorkspaceId={activeWorkspaceId}
          />
        )}

        {view === 'edit' && selectedArticle && (
          <ArticleEditor
            article={selectedArticle}
            onSubmit={(data) => handleEditArticle(selectedArticle.id, data)}
            onCancel={() => setView('view')}
            loading={loading}
            isEdit
            workspaces={workspaces}
            defaultWorkspaceId={activeWorkspaceId}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Article count: {articles.length}</p>
      </footer>

      <div className="notification-container">
        {notifications.map((notification) => (
          <NotificationDisplay
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
