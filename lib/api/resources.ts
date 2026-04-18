import { resolveCoreBaseUrl, apiRequest } from "./client";
import type { ResourceCreateData, ResourceListData, ResourceType } from "./types";

export const resourcesApi = {
  list(courseId: string) {
    return apiRequest<ResourceListData>(`/courses/${courseId}/resources`);
  },
  create(
    courseId: string,
    payload: {
      name: string;
      type: ResourceType;
      category?: string;
      externalUrl?: string;
      file?: File;
    },
  ) {
    const formData = new FormData();
    formData.set("name", payload.name);
    formData.set("type", payload.type);
    if (payload.category) {
      formData.set("category", payload.category);
    }
    if (payload.externalUrl) {
      formData.set("externalUrl", payload.externalUrl);
    }
    if (payload.file) {
      formData.set("file", payload.file);
    }

    return apiRequest<ResourceCreateData>(`/courses/${courseId}/resources`, {
      method: "POST",
      body: formData,
    });
  },
  buildFileUrl(resourceId: string) {
    return `${resolveCoreBaseUrl()}/api/v1/resources/${resourceId}/file`;
  },
};
