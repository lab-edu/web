import { apiRequest } from "./client";
import type { CourseCreateData, CourseDetail, CourseJoinData, CourseListData } from "./types";

export const coursesApi = {
  list() {
    return apiRequest<CourseListData>("/courses");
  },
  detail(courseId: string) {
    return apiRequest<CourseDetail>(`/courses/${courseId}`);
  },
  create(payload: { title: string; description?: string }) {
    return apiRequest<CourseCreateData>("/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  join(inviteCode: string) {
    return apiRequest<CourseJoinData>("/courses/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
  },
};
