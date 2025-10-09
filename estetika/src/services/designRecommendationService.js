import axios from "axios";
import Cookies from "js-cookie";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${Cookies.get("token")}`,
});

export const getRecommendations = async ({ page = 1, limit = 50 } = {}) => {
  const res = await axios.get(
    `${serverUrl}/api/project/recommendation?all=true&page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  );
  return res.data?.recommendations || [];
};

export const createRecommendation = async (payload) => {
  // payload: { title, imageLink?, specification?, budgetRange:{min,max}, designPreferences?:string[], type?:string, tags?:string[] }
  const res = await axios.post(
    `${serverUrl}/api/project/recommendation`,
    payload,
    { headers: { ...authHeaders(), "Content-Type": "application/json" } }
  );
  return res.data;
};

export const deleteRecommendation = async (id) => {
  const res = await axios.delete(
    `${serverUrl}/api/project/recommendation?id=${id}`,
    { headers: authHeaders() }
  );
  return res.data;
};

export default {
  getRecommendations,
  createRecommendation,
  deleteRecommendation,
};
