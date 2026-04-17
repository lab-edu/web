import { apiRequest } from "./client";
import type { AuthLoginData, AuthLoginPayload, AuthMeData } from "./types";

export const authApi = {
  login(payload: AuthLoginPayload) {
    return apiRequest<AuthLoginData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me() {
    return apiRequest<AuthMeData>("/auth/me");
  },
  logout() {
    return apiRequest<null>("/auth/logout", {
      method: "POST",
    });
  },
};
