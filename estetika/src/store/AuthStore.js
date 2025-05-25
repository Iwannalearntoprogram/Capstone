import { create } from "zustand";
import Cookies from "js-cookie";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,

  login: async (email, password, URL) => {
    const formData = { email, password };

    try {
      set({ isLoading: true });
      const response = await axios.post(`${URL}/api/auth/login`, formData);
      const data = response.data;
      const token = Cookies.get("token");
      Cookies.set("user", JSON.stringify(data.user), { expires: 1 });
      Cookies.set("token", JSON.stringify(data.token), { expires: 1 });
      localStorage.setItem("id", data.user.id);
      localStorage.setItem("role", data.user.role);

      set({
        user: data.user,
        token: token,
      });
      return { success: true };
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: e };
    }
  },

  logout: async () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("id");
    localStorage.removeItem("role");
    set({ token: null, user: null });
  },

  rehydrate: () => {
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");
    let user = null;
    if (userCookie) {
      try {
        user = JSON.parse(userCookie);
      } catch {
        user = null;
      }
    }
    set({ user, token });
  },
}));
