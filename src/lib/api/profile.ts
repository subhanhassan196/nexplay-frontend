import { api } from "@/lib/api/axios";

export interface ProfileDTO {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  country: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsDTO {
  id: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
  language: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const profileApi = {
  getMyProfile: () => api.get<Envelope<{ profile: ProfileDTO }>>("/users/me/profile"),

  updateProfile: (data: { displayName?: string; bio?: string; country?: string; visibility?: string }) =>
    api.patch<Envelope<{ profile: ProfileDTO }>>("/users/me/profile", data),

  /**
   * Uploads an avatar. The file goes to the server as multipart form data
   * and is validated there — the browser's reported MIME type is a hint,
   * not something worth trusting.
   */
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post<Envelope<{ profile: ProfileDTO }>>("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append("banner", file);
    return api.post<Envelope<{ profile: ProfileDTO }>>("/users/me/banner", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getSettings: () => api.get<Envelope<{ settings: UserSettingsDTO }>>("/users/me/settings"),
  updateSettings: (data: Partial<UserSettingsDTO>) =>
    api.patch<Envelope<{ settings: UserSettingsDTO }>>("/users/me/settings", data),
};
