'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Lightbulb, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  action_text?: string;
  read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  onCountChange?: (count: number) => void;
}

export default function NotificationsPanel({ onCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications || []);

      if (onCountChange) {
        onCountChange(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('[NotificationsPanel] Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      // Update unread count
      const unreadCount = notifications.filter((n) => !n.read && n.id !== id).length;
      if (onCountChange) {
        onCountChange(unreadCount);
      }
    } catch (error) {
      console.error('[NotificationsPanel] Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Update unread count
      const deletedNotification = notifications.find((n) => n.id === id);
      if (deletedNotification && !deletedNotification.read && onCountChange) {
        const unreadCount = notifications.filter((n) => !n.read && n.id !== id).length;
        onCountChange(unreadCount);
      }
    } catch (error) {
      console.error('[NotificationsPanel] Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'insight':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          You'll be notified when new recommendations are available
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {notifications.filter((n) => !n.read).length} unread
        </p>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.read ? 'bg-primary/5' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator & Delete button */}
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => deleteNotification(notification.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push('/dashboard/settings')}
          >
            Notification Settings
          </Button>
        </div>
      )}
    </div>
  );
}
