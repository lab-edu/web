import { apiRequest } from "./client";
import type { CourseAnnouncementCreateData, CourseAnnouncementListData } from "./types";

export const announcementsApi = {
  list(courseId: string) {
    return apiRequest<CourseAnnouncementListData>(`/courses/${courseId}/announcements`);
  },
  create(courseId: string, payload: { title: string; content: string }) {
    return apiRequest<CourseAnnouncementCreateData>(`/courses/${courseId}/announcements`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
