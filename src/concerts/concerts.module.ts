import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { Concert } from './entities/concert.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SharedModule } from '../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, Ticket]),
    SharedModule,
    NotificationsModule,
  ],
  controllers: [ConcertsController],
  providers: [ConcertsService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
