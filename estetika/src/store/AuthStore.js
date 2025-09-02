import { create } from "zustand";
import Cookies from "js-cookie";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  lastVerification: null,

  login: async (email, password, URL) => {
    const formData = { email, password };

    try {
      set({ isLoading: true });
      const response = await axios.post(`${URL}/api/auth/login`, formData);
      const data = response.data;

      if (data.user.role === "client") {
        alert("Clients can only login through our mobile app.");
        return { success: false };
      }

      Cookies.set("temp_user", JSON.stringify(data.user), { expires: 1 });
      Cookies.set("temp_token", `${data.token}`, { expires: 1 });
      localStorage.setItem("temp_id", data.user.id);
      localStorage.setItem("temp_role", data.user.role);

      set({
        user: data.user,
        token: data.token,
      });
      // Return user and token here!
      return { success: true, user: data.user, token: data.token };
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
    localStorage.removeItem("lastVerification");
    set({ token: null, user: null, lastVerification: null });
  },

  setUserAndToken: (user, token) => {
    const now = new Date().getTime();
    set({ user, token, lastVerification: now });

    localStorage.setItem("lastVerification", now.toString());
    Cookies.set("user", JSON.stringify(user), { expires: 1 });
    Cookies.set("token", token, { expires: 1 });
  },

  checkRecentVerification: () => {
    const lastVerification = localStorage.getItem("lastVerification");
    if (!lastVerification) return false;

    const now = new Date().getTime();
    const verificationTime = parseInt(lastVerification);
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return now - verificationTime < twentyFourHours;
  },
  rehydrate: () => {
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");
    const lastVerification = localStorage.getItem("lastVerification");
    let user = null;
    if (userCookie) {
      try {
        user = JSON.parse(userCookie);
      } catch {
        user = null;
      }
    }
    set({
      user,
      token,
      lastVerification: lastVerification ? parseInt(lastVerification) : null,
    });
  },
}));
