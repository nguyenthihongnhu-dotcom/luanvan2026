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
  connected: (payload: { userId: string }) => void;
};

type SocketAuth = {
  token?: unknown;
};

type SocketData = {
  user: AuthUser;
};

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
    socket.emit('connected', { userId: socket.data.user.id });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
}
