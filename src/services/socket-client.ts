"use client";

import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const token = Cookies.get("_access_token");
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        token: token || ""
      }
    });
  }

  return socket;
}
