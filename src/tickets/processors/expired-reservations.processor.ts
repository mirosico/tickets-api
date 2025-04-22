import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  EXPIRED_RESERVATIONS_PROCESSOR,
  PROCESS_EXPIRED_RESERVATIONS_JOB,
} from '../tickets.constants';
import { CartsService } from '../../carts/carts.service';
import { getErrorMessage } from '../../shared/utils';

@Processor(EXPIRED_RESERVATIONS_PROCESSOR)
export class ExpiredReservationsProcessor {
  private readonly logger = new Logger(ExpiredReservationsProcessor.name);

  constructor(private cartsService: CartsService) {}

  // Запускаємо обробку прострочених резервацій кожну хвилину
  @Cron('0 * * * * *')
  async handleCron() {
    this.logger.debug('Запуск планової обробки прострочених резервацій');
    await this.processExpiredReservations();
  }

  @Process(PROCESS_EXPIRED_RESERVATIONS_JOB)
  async processExpiredReservations() {
    try {
      const processedCount =
        await this.cartsService.processExpiredReservations();
      this.logger.debug(`Оброблено прострочених резервацій: ${processedCount}`);
    } catch (error) {
      this.logger.error(
        `Помилка при обробці прострочених резервацій: ${getErrorMessage(error)}`,
      );
    }
  }
}
