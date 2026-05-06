import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { startSLACronJob } from './jobs/slaCron';
import { verifySmtp } from './utils/email';
import { initSocketServer } from './services/socket.service';

async function bootstrap(): Promise<void> {
  await connectDB();
  await verifySmtp();
  startSLACronJob();

  const httpServer = createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`🚀 FixFlow server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
