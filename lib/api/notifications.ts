import { apiRequest } from "./client";
import type { InboxNotificationItem, InboxNotificationListData } from "./types";

export const notificationsApi = {
  list(unreadOnly?: boolean) {
    const query = unreadOnly ? "?unreadOnly=true" : "";
    return apiRequest<InboxNotificationListData>(`/notifications${query}`);
  },

  markRead(notificationId: string) {
    return apiRequest<InboxNotificationItem>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  markAllRead() {
    return apiRequest<number>(`/notifications/read-all`, {
      method: "PATCH",
    });
  },
};
