import { apiRequest } from "./client";
import type { ExperimentCreateData, ExperimentDetail, ExperimentListData } from "./types";

export const experimentsApi = {
  list(courseId: string) {
    return apiRequest<ExperimentListData>(`/courses/${courseId}/experiments`);
  },
  detail(courseId: string, experimentId: string) {
    return apiRequest<ExperimentDetail>(`/courses/${courseId}/experiments/${experimentId}`);
  },
  create(courseId: string, payload: { title: string; description?: string; dueAt?: string | null }) {
    return apiRequest<ExperimentCreateData>(`/courses/${courseId}/experiments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
