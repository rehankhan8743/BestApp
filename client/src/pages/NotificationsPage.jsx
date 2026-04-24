import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const NotificationsPage = () => {
  const { get, put, del } = useApi();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const params = filter === 'unread' ? '?unread=true' : '';
      const res = await get(`/notifications${params}`);
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await put(`/notifications/${id}/read`);
      if (res?.success) {
        setNotifications(notifications.map(n => 
          n._id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await put('/notifications/read-all');
      if (res?.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await del(`/notifications/${id}`);
      if (res?.success) {
        setNotifications(notifications.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'reply':
      case 'mention':
        return '💬';
      case 'follow':
        return '👤';
      case 'report':
        return '⚠️';
      case 'ban':
        return '🚫';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 bg-secondary rounded border border-border"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border transition-colors ${
                notification.isRead
                  ? 'bg-card border-border'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                
                <div className="flex-1">
                  <p className={notification.isRead ? 'text-muted-foreground' : 'font-medium'}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{formatDate(notification.createdAt)}</span>
                    {notification.thread && (
                      <a
                        href={`/thread/${notification.thread.slug}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View thread
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 hover:bg-secondary rounded"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 hover:bg-red-500/20 rounded text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? "You're all caught up!" 
                : "When you get notifications, they'll appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
