import cron from 'node-cron';
import { sweepAllTickets } from '../utils/slaEngine';

export function startSLACronJob(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log(`[SLA Cron] Starting sweep at ${new Date().toISOString()}`);

    try {
      const result = await sweepAllTickets();
      console.log(
        `[SLA Cron] Sweep complete — processed: ${result.processed}, newly breached: ${result.breached}`
      );
    } catch (error) {
      console.error('[SLA Cron] Sweep failed:', error);
    }
  });

  console.log('✅ SLA cron job scheduled (every 15 minutes)');
}
