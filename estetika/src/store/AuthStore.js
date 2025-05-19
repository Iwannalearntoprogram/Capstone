import { create } from "zustand";
import Cookies from "js-cookie";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email, password) => {
    const formData = { email, password };

    try {
      set({ isLoading: true });
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        formData
      );
      console.log("Login response: ", response);
      const { token, user } = response.data;
      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user", JSON.stringify(user), { expires: 7 });
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: e };
    }
  },

  logout: async () => {
    Cookies.remove("token");
    Cookies.remove("user");
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    try {
      const token = Cookies.get("token");
      const userJson = Cookies.get("user");
      const user = userJson ? JSON.parse(userJson) : null;
      set({ user: user ? user : null, token: token ? token : null });
    } catch (e) {
      console.error("Error checking auth: ", e);
    }
  },
}));
