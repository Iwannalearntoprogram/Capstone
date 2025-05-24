import { io } from "socket.io-client";
import Cookies from "js-cookie";

const token = Cookies.get("token");

const serverUrl = import.meta.env.VITE_SERVER_URL;

const socket = io(serverUrl, {
  auth: {
    token: token,
  },
});

export default socket;
