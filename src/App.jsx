import { useState, useEffect } from 'react';
import './App.css';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleEditor from './components/ArticleEditor';
import NotificationDisplay from './components/NotificationDisplay';
import { useWebSocket } from './hooks/useWebSocket';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [view, setView] = useState('list');
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleWebSocketMessage = (data) => {
    const notification = {
      id: Date.now(),
      type: data.type,
      message: data.message,
      timestamp: data.timestamp,
    };
    
    setNotifications((prev) => [...prev, notification]);

    if (data.type !== 'connection' && view === 'list') {
      fetchArticles();
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

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/articles`);
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
  };

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
      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to create article');
      }

      await fetchArticles();
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
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : data.error || 'Failed to update article');
      }

      await fetchArticles();
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

      await fetchArticles();
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
          />
        )}

        {view === 'create' && (
          <ArticleEditor
            onSubmit={handleCreateArticle}
            onCancel={handleBackToList}
            loading={loading}
          />
        )}

        {view === 'edit' && selectedArticle && (
          <ArticleEditor
            article={selectedArticle}
            onSubmit={(data) => handleEditArticle(selectedArticle.id, data)}
            onCancel={() => setView('view')}
            loading={loading}
            isEdit
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Article count: {articles.length}</p>
      </footer>

      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ marginTop: index > 0 ? '12px' : '0' }}>
            <NotificationDisplay
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
