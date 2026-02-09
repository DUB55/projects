import { io, Socket } from "socket.io-client";

export function createSocket(baseUrl: string): Socket {
  return io(baseUrl, { transports: ["websocket"] });
}
