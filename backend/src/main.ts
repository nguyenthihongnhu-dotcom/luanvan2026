import { createServer } from 'node:http';
import { createApp } from './app';
import { config } from './config/config';
import { closeDatabasePool } from './database/db';
import { initializeSocket } from './socket/socket';

const app = createApp();
const server = createServer(app);
const io = initializeSocket(server);

server.listen(config.port, () => {
  console.log(`Warehouse API listening on port ${config.port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Received ${signal}, shutting down`);

  void io.close();
  server.close(() => {
    void closeDatabasePool().finally(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
