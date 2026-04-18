import { apiRequest } from "./client";
import type { SubmissionCreateData, SubmissionDetail, SubmissionListData } from "./types";

export const submissionsApi = {
  list(experimentId: string) {
    return apiRequest<SubmissionListData>(`/experiments/${experimentId}/submissions`);
  },
  latest(experimentId: string) {
    return apiRequest<SubmissionDetail>(`/experiments/${experimentId}/submissions/latest`);
  },
  create(experimentId: string, payload: { file: File; note?: string }) {
    const formData = new FormData();
    formData.set("file", payload.file);
    if (payload.note) {
      formData.set("note", payload.note);
    }

    return apiRequest<SubmissionCreateData>(`/experiments/${experimentId}/submissions`, {
      method: "POST",
      body: formData,
    });
  },
  grade(submissionId: string, payload: { score: number; feedback?: string }) {
    return apiRequest<SubmissionDetail>(`/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
