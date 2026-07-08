import { Injectable, Logger } from '@nestjs/common';

/**
 * Prevents overlapping runs of the same scheduled job.
 * If a tick fires while the previous run is still in progress, the new tick is skipped.
 */
@Injectable()
export class JobMutex {
  private readonly locks = new Map<string, boolean>();
  private readonly logger = new Logger(JobMutex.name);

  async run<T>(jobName: string, fn: () => Promise<T>): Promise<T | null> {
    if (this.locks.get(jobName)) {
      this.logger.warn(`${jobName}: skipped — previous run still in progress`);
      return null;
    }

    this.locks.set(jobName, true);
    try {
      return await fn();
    } finally {
      this.locks.set(jobName, false);
    }
  }
}
