import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
  organization_id: string;
}

export function NotificationsDropdown() {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)));
          setUnreadCount((prev) => (updatedNotification.is_read ? Math.max(0, prev - 1) : prev));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user?.id)
        .eq("is_read", false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Get organization ID from notification
    const orgId = notification.organization_id;

    if (!orgId) {
      toast({
        title: "Navigation Error",
        description: "Unable to navigate - organization not found",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }

    // Determine user's role in this organization
    try {
      // First, try to check if user is an agency member
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user?.id)
        .eq("organization_id", orgId)
        .maybeSingle();

      console.log("Member data:", memberData, "Error:", memberError);

      let isAgencyUser = false;

      if (memberData) {
        // User is an agency member
        isAgencyUser = ["owner", "admin", "member"].includes(memberData.role);
      } else {
        // Check if user is a client instead
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user?.id)
          .eq("organization_id", orgId)
          .maybeSingle();

        console.log("Client data:", clientData, "Error:", clientError);

        // If not found in either table, default to agency view (safest option)
        isAgencyUser = !clientData;
      }

      const { metadata } = notification;

      // Route based on user role and notification type
      if (isAgencyUser) {
        // Agency user routes
        switch (notification.type) {
          case "client_added":
            if (metadata?.client_id) {
              navigate(`/clients/${orgId}/${metadata.client_id}`);
            } else {
              navigate(`/clients/${orgId}`);
            }
            break;

          case "form_submitted":
          case "submission_incomplete":
            navigate(`/submissions/${orgId}`);
            break;

          case "reminder_sent":
            navigate(`/reminders/${orgId}`);
            break;

          default:
            // Default to dashboard for agency users
            navigate(`/dashboard/${orgId}`);
        }
      } else {
        // Client user routes - go to client portal
        switch (notification.type) {
          case "form_submitted":
          case "submission_incomplete":
            navigate(`/client-portal/${orgId}`);
            break;

          case "reminder_sent":
            navigate(`/client-portal/${orgId}/tasks`);
            break;

          case "file_uploaded":
            navigate(`/client-portal/${orgId}/files`);
            break;

          case "contract_added":
            navigate(`/client-portal/${orgId}/contracts`);
            break;

          case "invoice_sent":
            navigate(`/client-portal/${orgId}/billing`);
            break;

          case "meeting_scheduled":
            navigate(`/client-portal/${orgId}/meetings`);
            break;

          default:
            // Default to client portal home
            navigate(`/client-portal/${orgId}`);
        }
      }
    } catch (error: any) {
      console.error("Error determining user role:", error);
      // Fallback: try to navigate to dashboard as a safe default
      navigate(`/dashboard/${orgId}`);
    }

    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "client_added":
        return "👤";
      case "form_submitted":
        return "📝";
      case "reminder_sent":
        return "⏰";
      case "submission_incomplete":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
