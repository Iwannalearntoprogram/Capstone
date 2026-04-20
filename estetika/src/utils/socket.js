import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { SERVER_URL } from "../config/server";

const token = Cookies.get("token");

const socket = io(SERVER_URL, {
  auth: {
    token: token,
  },
});

export default socket;
