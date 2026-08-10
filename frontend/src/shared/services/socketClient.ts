import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './httpClient';
import { env } from '../config/env';

let socketInstance: Socket | null = null;
let socketToken: string | null = null;

export function getNotificationSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  if (socketInstance && socketToken !== token) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  if (!socketInstance) {
    const serverUrl = env.apiBaseUrl.replace(/\/api\/?$/, '');

    socketToken = token;
    socketInstance = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (!socketInstance.connected) {
    socketToken = token;
    socketInstance.auth = { token };
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectNotificationSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  socketToken = null;
}
