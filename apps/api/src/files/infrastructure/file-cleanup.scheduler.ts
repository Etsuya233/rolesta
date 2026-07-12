import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { CleanupFilesUseCase } from '../application/cleanup-files.use-case.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class FileCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileCleanupScheduler.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(private readonly cleanupFiles: CleanupFilesUseCase) {}

  onModuleInit(): void {
    void this.runCleanup();
    this.interval = setInterval(() => void this.runCleanup(), CLEANUP_INTERVAL_MS);
    this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async runCleanup(): Promise<void> {
    try {
      const count = await this.cleanupFiles.execute();
      if (count > 0) {
        this.logger.log({ count }, 'Expired file resources cleaned');
      }
    } catch (error) {
      this.logger.error({ error }, 'File cleanup failed');
    }
  }
}
