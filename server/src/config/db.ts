import mongoose from 'mongoose';

// Reuse the same connection across warm serverless invocations
let connectionPromise: Promise<void> | null = null;

const connectDB = async (): Promise<void> => {
  if (connectionPromise) return connectionPromise;

  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  connectionPromise = mongoose
    .connect(uri, {
      dbName: 'fixflow',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
    })
    .catch((error: unknown) => {
      connectionPromise = null; // allow retry on next request
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ MongoDB connection error: ${msg}`);

      if (msg.includes('ECONNREFUSED')) {
        console.error('💡 Check that your IP is whitelisted in Atlas Network Access');
      }
      if (msg.includes('Authentication failed')) {
        console.error('💡 Check your username and password in MONGODB_URI');
      }
      if (msg.includes('querySrv')) {
        console.error('💡 Check your cluster hostname in MONGODB_URI');
      }
      throw error;
    });

  return connectionPromise;
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  connectionPromise = null; // allow reconnect
});

export { connectDB };
