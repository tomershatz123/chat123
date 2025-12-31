import { io } from "socket.io-client";

const URL = "http://localhost:5001";

// We initialize the socket but don't connect yet.
// We'll connect manually once the user logs in.
export const socket = io(URL, {
  autoConnect: false, 
});