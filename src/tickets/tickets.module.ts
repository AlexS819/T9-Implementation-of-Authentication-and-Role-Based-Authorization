import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketEntity } from './entities/ticket.entity';
import { EventEntity } from './entities/event.entity';
import { BenefitEntity } from './entities/benefit.entity';
import { SeatPlacementEntity } from './entities/seat-placement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketEntity,
      EventEntity,
      BenefitEntity,
      SeatPlacementEntity,
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
