import api from "./api";
import type { User } from "@/types";

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data; // Backend returns { success, message, data: { user, token } }
  },

  register: async (fullName: string, email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post("/auth/register", { fullName, email, password });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getMe: async (): Promise<User> => {
    try {
      const { data } = await api.get("/auth/me");
      return data.data.user; // Backend returns { success, data: { user } }
    } catch {
      return null as any;
    }
  },
};