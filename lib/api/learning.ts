import { apiRequest, resolveCoreBaseUrl } from "./client";
import type {
  CourseLearningDetail,
  CourseLearningOverview,
  CourseLearningTaskSubmission,
  CourseLearningTaskSubmissionListData,
  CourseLearningTaskSummary,
  CourseLearningUnit,
  CourseLearningPoint,
  LearningMaterialType,
  LearningQuestionType,
  LearningTaskType,
} from "./types";

export const learningApi = {
  detail(courseId: string) {
    return apiRequest<CourseLearningDetail>(`/courses/${courseId}/learning`);
  },
  overview(courseId: string) {
    return apiRequest<CourseLearningOverview>(`/courses/${courseId}/learning/overview`);
  },
  createUnit(courseId: string, payload: { title: string; description?: string; sortOrder?: number; published?: boolean }) {
    return apiRequest<CourseLearningUnit>(`/courses/${courseId}/learning/units`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createPoint(courseId: string, unitId: string, payload: { title: string; summary?: string; estimatedMinutes?: number; sortOrder?: number }) {
    return apiRequest<CourseLearningPoint>(`/courses/${courseId}/learning/units/${unitId}/points`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createTask(
    courseId: string,
    pointId: string,
    payload: {
      title: string;
      description?: string;
      taskType?: LearningTaskType;
      materialType?: LearningMaterialType;
      contentText?: string;
      mediaUrl?: string;
      questionType?: LearningQuestionType;
      optionsText?: string;
      referenceAnswer?: string;
      maxScore?: number;
      required?: boolean;
      sortOrder?: number;
      file?: File;
    },
  ) {
    const formData = new FormData();
    formData.set("title", payload.title);
    if (payload.description) {
      formData.set("description", payload.description);
    }
    if (payload.taskType) {
      formData.set("taskType", payload.taskType);
    }
    if (payload.materialType) {
      formData.set("materialType", payload.materialType);
    }
    if (payload.contentText) {
      formData.set("contentText", payload.contentText);
    }
    if (payload.mediaUrl) {
      formData.set("mediaUrl", payload.mediaUrl);
    }
    if (payload.questionType) {
      formData.set("questionType", payload.questionType);
    }
    if (payload.optionsText) {
      formData.set("optionsText", payload.optionsText);
    }
    if (payload.referenceAnswer) {
      formData.set("referenceAnswer", payload.referenceAnswer);
    }
    if (typeof payload.maxScore === "number") {
      formData.set("maxScore", String(payload.maxScore));
    }
    if (typeof payload.required === "boolean") {
      formData.set("required", String(payload.required));
    }
    if (typeof payload.sortOrder === "number") {
      formData.set("sortOrder", String(payload.sortOrder));
    }
    if (payload.file) {
      formData.set("file", payload.file);
    }

    return apiRequest<CourseLearningTaskSummary>(`/courses/${courseId}/learning/points/${pointId}/tasks`, {
      method: "POST",
      body: formData,
    });
  },
  taskFileUrl(courseId: string, taskId: string) {
    return `${resolveCoreBaseUrl()}/api/v1/courses/${courseId}/learning/tasks/${taskId}/file`;
  },
  taskSubmissions(courseId: string, taskId: string) {
    return apiRequest<CourseLearningTaskSubmissionListData>(`/courses/${courseId}/learning/tasks/${taskId}/submissions`);
  },
  latestSubmission(courseId: string, taskId: string) {
    return apiRequest<CourseLearningTaskSubmission>(`/courses/${courseId}/learning/tasks/${taskId}/submissions/latest`);
  },
  submitTask(
    courseId: string,
    taskId: string,
    payload: { answerText?: string; file?: File },
  ) {
    const formData = new FormData();
    if (payload.answerText) {
      formData.set("answerText", payload.answerText);
    }
    if (payload.file) {
      formData.set("file", payload.file);
    }

    return apiRequest<CourseLearningTaskSubmission>(`/courses/${courseId}/learning/tasks/${taskId}/submissions`, {
      method: "POST",
      body: formData,
    });
  },
  gradeSubmission(courseId: string, submissionId: string, payload: { score: number; feedback?: string }) {
    return apiRequest<CourseLearningTaskSubmission>(`/courses/${courseId}/learning/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};