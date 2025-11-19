import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './NotificationDisplay.css';

function NotificationDisplay({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    const hideTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [handleClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'article_created':
        return '+';
      case 'article_updated':
        return '✓';
      case 'article_deleted':
        return 'x';
      case 'file_attached':
        return '↑';
      case 'file_deleted':
        return 'x';
      case 'connection':
        return '•';
      default:
        return '!';
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'article_created':
        return 'notification-success';
      case 'article_updated':
        return 'notification-info';
      case 'article_deleted':
      case 'file_deleted':
        return 'notification-warning';
      case 'file_attached':
        return 'notification-success';
      case 'connection':
        return 'notification-info';
      default:
        return 'notification-default';
    }
  };

  return (
    <div
      className={`notification ${getNotificationClass(notification.type)} ${
        isVisible ? 'notification-visible' : ''
      } ${isExiting ? 'notification-exiting' : ''}`}
    >
      <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
      <div className="notification-content">
        <div className="notification-message">{notification.message}</div>
        {notification.timestamp && (
          <div className="notification-time">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
      <button className="notification-close" onClick={handleClose}>
        ✕
      </button>
    </div>
  );
}

NotificationDisplay.propTypes = {
  notification: PropTypes.shape({
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NotificationDisplay;

