import { apiRequest } from "./client";
import type { AuthLoginData, AuthLoginPayload, AuthMeData, AuthRegisterData, AuthRegisterPayload } from "./types";

export const authApi = {
  register(payload: AuthRegisterPayload) {
    return apiRequest<AuthRegisterData>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
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
