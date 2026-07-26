import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from '../config/config';
import {
  extractBearerToken,
  verifyAccessToken,
} from '../modules/auth/auth.service';
import type { AuthUser } from '../modules/auth/auth.model';

type ClientToServerEvents = {
  ping: () => void;
};

type ServerToClientEvents = {
  pong: () => void;
  connected: (payload: { userId: number | string }) => void;
  'notification:new': (notification: Record<string, unknown>) => void;
};

type SocketAuth = {
  token?: unknown;
};

type SocketData = {
  user: AuthUser;
};

let ioInstance: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null = null;

export function initializeSocket(
  server: HttpServer,
): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    void (async () => {
      try {
        const socketAuth = socket.handshake.auth as SocketAuth;
        const token =
          typeof socketAuth.token === 'string'
            ? socketAuth.token
            : extractBearerToken(socket.handshake.headers.authorization);

        socket.data.user = await verifyAccessToken(token);
        next();
      } catch (error) {
        next(
          error instanceof Error
            ? error
            : new Error('Socket authentication failed'),
        );
      }
    })();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    void socket.join(`user:${userId}`);
    socket.emit('connected', { userId });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  ioInstance = io;
  return io;
}

export function emitNotificationToUser(
  userId: number | string,
  notification: Record<string, unknown>,
): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }
}
