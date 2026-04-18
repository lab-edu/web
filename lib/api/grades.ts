import { apiRequest } from "./client";
import type { CourseGradeOverview } from "./types";

export const gradesApi = {
  overview(courseId: string) {
    return apiRequest<CourseGradeOverview>(`/courses/${courseId}/grades/overview`);
  },
};
