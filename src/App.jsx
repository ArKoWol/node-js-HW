import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleEditor from './components/ArticleEditor';
import NotificationDisplay from './components/NotificationDisplay';
import { useWebSocket } from './hooks/useWebSocket';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import UserManagement from './components/UserManagement';

const API_URL = 'http://localhost:3000/api';

function App() {
  const { isAuthenticated, loading: authLoading, getAuthHeaders, logout, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
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
  const [viewingVersion, setViewingVersion] = useState(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lastFetchedSearchRef = useRef('');

  const resetVersionState = () => {
    setViewingVersion(null);
    setSelectedVersionNumber(null);
    setVersionLoading(false);
  };

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setWorkspacesLoading(true);
    setWorkspacesError(null);
    try {
      const response = await fetch(`${API_URL}/workspaces`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
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
  }, [isAuthenticated, getAuthHeaders, logout]);

  const fetchArticles = useCallback(async (workspaceId, search = '') => {
    if (!workspaceId || !isAuthenticated) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/articles?workspaceId=${workspaceId}`;
      if (search && search.trim().length > 0) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
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
  }, [isAuthenticated, getAuthHeaders, logout]);

  // Use ref to store fetchArticles to avoid dependency issues
  const fetchArticlesRef = useRef(fetchArticles);
  useEffect(() => {
    fetchArticlesRef.current = fetchArticles;
  }, [fetchArticles]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces]);

  useEffect(() => {
    if (isAuthenticated && activeWorkspaceId) {
      const workspaceKey = `${activeWorkspaceId}-${searchQuery || ''}`;
      if (lastFetchedSearchRef.current !== workspaceKey) {
        lastFetchedSearchRef.current = workspaceKey;
        fetchArticlesRef.current(activeWorkspaceId, searchQuery || '');
      }
    }
  }, [isAuthenticated, activeWorkspaceId, searchQuery]);

  const handleWebSocketMessage = (data) => {
    const notification = {
      id: Date.now(),
      type: data.type,
      message: data.message,
      timestamp: data.timestamp,
    };
    
    setNotifications((prev) => [notification, ...prev].slice(0, 5));

    if (data.type !== 'connection' && view === 'list' && activeWorkspaceId) {
      const currentSearch = searchQuery || '';
      const workspaceKey = `${activeWorkspaceId}-${currentSearch}`;
      if (lastFetchedSearchRef.current !== workspaceKey) {
        lastFetchedSearchRef.current = workspaceKey;
        fetchArticlesRef.current(activeWorkspaceId, currentSearch);
      }
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
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      const data = await response.json();
      setSelectedArticle(data.article);
      resetVersionState();
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
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ...articleData, workspaceId }),
      });

      if (response.status === 401) {
        logout();
        return { success: false, error: 'Authentication required' };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to create article');
      }

      await fetchArticles(workspaceId);
      await fetchWorkspaces();
      setView('list');
      resetVersionState();
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
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ...articleData, workspaceId }),
      });

      if (response.status === 401) {
        logout();
        return { success: false, error: 'Authentication required' };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to update article');
      }

      await fetchArticles(workspaceId);
      await fetchWorkspaces();
      setSelectedArticle(data.article);
      resetVersionState();
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
    setDeleteConfirmation({
      articleId,
      show: true
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    const articleId = deleteConfirmation.articleId;
    setDeleteConfirmation(null);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }

      await fetchArticles(activeWorkspaceId);
      await fetchWorkspaces();
      setView('list');
      setSelectedArticle(null);
      resetVersionState();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting article:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedArticle(null);
    setError(null);
    resetVersionState();
  };

  const handleCreateNew = () => {
    setView('create');
    setError(null);
    resetVersionState();
  };

  const handleEditMode = () => {
    setView('edit');
    setError(null);
    resetVersionState();
  };

  const handleAddComment = async (articleId, commentData) => {
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(commentData)
      });
      
      if (response.status === 401) {
        logout();
        return { success: false, error: 'Authentication required' };
      }
      
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
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(commentData)
      });
      
      if (response.status === 401) {
        logout();
        return { success: false, error: 'Authentication required' };
      }
      
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
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return { success: false, error: 'Authentication required' };
      }
      
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

  const handleVersionChange = async (versionNumber) => {
    if (!selectedArticle) {
      return;
    }

    if (versionNumber === selectedArticle.currentVersionNumber) {
      resetVersionState();
      return;
    }

    setSelectedVersionNumber(versionNumber);
    setVersionLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/articles/${selectedArticle.id}/versions/${versionNumber}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load version');
      }
      setViewingVersion(data.version);
    } catch (err) {
      setError(err.message);
      console.error('Error loading version:', err);
      setSelectedVersionNumber(viewingVersion?.versionNumber || null);
    } finally {
      setVersionLoading(false);
    }
  };

  const handleVersionReset = () => {
    resetVersionState();
  };

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  const { user } = useAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register pages if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
      </>
    );
  }

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
            <div style={{ color: 'white', marginRight: '1rem' }}>
              {user?.email}
            </div>
            {isAdmin && view !== 'users' && (
              <button className="btn btn-secondary" onClick={() => setView('users')}>
                User Management
              </button>
            )}
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
            {view !== 'list' && view !== 'users' && (
              <button className="btn btn-secondary" onClick={handleBackToList}>
                ← Back to List
              </button>
            )}
            {view === 'users' && (
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
            resetVersionState();
            setView('list');
            setSearchQuery('');
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

        {deleteConfirmation?.show && (
          <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-dialog">
              <h3>Delete Article</h3>
              <p>Are you sure you want to delete this article? This action cannot be undone.</p>
              <div className="delete-confirmation-actions">
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
                <button className="btn btn-secondary" onClick={cancelDelete}>
                  Cancel
                </button>
              </div>
            </div>
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {view === 'view' && selectedArticle && (
          <ArticleView
            article={selectedArticle}
            loading={loading}
            versionOverride={viewingVersion}
            versionLoading={versionLoading}
            selectedVersionNumber={selectedVersionNumber}
            onVersionChange={handleVersionChange}
            onVersionReset={handleVersionReset}
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

        {view === 'users' && isAdmin && (
          <UserManagement />
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
