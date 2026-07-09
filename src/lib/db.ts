import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// WebSocket untuk koneksi lokal
neonConfig.webSocketConstructor = ws;

// ✅ Tambahkan ini — paksa Neon pakai WebSocket, bukan TCP
neonConfig.wsProxy = (host) => `${host}/v2`;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

const connectionString = process.env.DATABASE_URL!;

// Cache database connection on global object in development
// to avoid exhausting connection limits during hot reloads (Fast Refresh).
const globalForDb = globalThis as unknown as {
  neonPool: Pool | undefined;
};

const pool = globalForDb.neonPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.neonPool = pool;
}

export const db = drizzle(pool);