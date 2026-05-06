import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env['PORT'] ?? '5000', 10),
  mongodbUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h',
  clientUrl: (process.env['CLIENT_URL'] ?? 'http://localhost:5173').trim(),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  uploadDir: process.env['UPLOAD_DIR'] ?? './uploads',
  // Email (SMTP) — optional; notifications are skipped if not configured
  smtpHost: process.env['SMTP_HOST'] ?? '',
  smtpPort: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
  smtpUser: process.env['SMTP_USER'] ?? '',
  smtpPass: process.env['SMTP_PASS'] ?? '',
  // AI image analysis — optional; feature is off unless AI_ANALYSIS_ENABLED=true
  anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
  aiAnalysisEnabled: process.env['AI_ANALYSIS_ENABLED'] === 'true',
} as const;
