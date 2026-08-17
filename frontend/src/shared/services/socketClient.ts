import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';
import { getAccessToken } from './httpClient';

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
    // Cả dự án cấu hình backend bằng VITE_API_BASE_URL; đọc VITE_API_URL (biến
    // không tồn tại) khiến socket luôn rơi về localhost:3000 và chết ngay khi
    // backend nằm ở host hoặc cổng khác.
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
