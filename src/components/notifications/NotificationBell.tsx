'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import NotificationsPanel from './NotificationsPanel';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true');
      if (!response.ok) return;

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('[NotificationBell] Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // Refresh count when panel opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchUnreadCount();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationsPanel onCountChange={setUnreadCount} />
      </PopoverContent>
    </Popover>
  );
}
