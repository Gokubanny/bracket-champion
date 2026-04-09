import api from "./api";
import type { User } from "@/types";

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  register: async (fullName: string, email: string, password: string): Promise<void> => {
    await api.post("/auth/register", { fullName, email, password });
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};
