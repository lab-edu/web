import { apiRequest } from "./client";
import type {
  AssignmentResponse,
  AssignmentCreateRequest,
  AssignmentUpdateRequest,
  AssignmentSubmissionResponse,
  AssignmentSubmissionRequest,
  AssignmentGradeRequest,
  AssignmentAiGradeDraftResponse,
  CourseHomeworkListData,
} from "./types";

export const assignmentsApi = {
  list(courseId: string) {
    return apiRequest<AssignmentResponse[]>(`/courses/${courseId}/assignments`);
  },

  detail(courseId: string, assignmentId: string) {
    return apiRequest<AssignmentResponse>(`/courses/${courseId}/assignments/${assignmentId}`);
  },

  create(courseId: string, payload: AssignmentCreateRequest) {
    return apiRequest<AssignmentResponse>(`/courses/${courseId}/assignments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(courseId: string, assignmentId: string, payload: AssignmentUpdateRequest) {
    return apiRequest<AssignmentResponse>(`/courses/${courseId}/assignments/${assignmentId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete(courseId: string, assignmentId: string) {
    return apiRequest<void>(`/courses/${courseId}/assignments/${assignmentId}`, {
      method: "DELETE",
    });
  },

  submit(courseId: string, assignmentId: string, payload: AssignmentSubmissionRequest) {
    return apiRequest<AssignmentSubmissionResponse>(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listSubmissions(courseId: string, assignmentId: string) {
    return apiRequest<AssignmentSubmissionResponse[]>(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
  },

  getLatestSubmission(courseId: string, assignmentId: string) {
    return apiRequest<AssignmentSubmissionResponse>(`/courses/${courseId}/assignments/${assignmentId}/submissions/latest`);
  },

  grade(courseId: string, submissionId: string, payload: AssignmentGradeRequest) {
    return apiRequest<AssignmentSubmissionResponse>(`/courses/${courseId}/assignments/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  aiGradeDraft(courseId: string, assignmentId: string, submissionId: string) {
    return apiRequest<AssignmentAiGradeDraftResponse>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/ai-grade-draft`,
      {
        method: "POST",
      },
    );
  },

  listMyAssignments() {
    return apiRequest<CourseHomeworkListData>("/homeworks/mine");
  },
};