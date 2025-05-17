import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL;

const socket = io(serverUrl, {
  auth: {
    token: token,
  },
});

export default socket;
