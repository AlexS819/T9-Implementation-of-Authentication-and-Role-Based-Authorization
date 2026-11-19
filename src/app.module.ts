import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UserEntity } from './users/entities/user.entity';
import { TicketEntity } from './tickets/entities/ticket.entity';
import { EventEntity } from './tickets/entities/event.entity';
import { BenefitEntity } from './tickets/entities/benefit.entity';
import { SeatPlacementEntity } from './tickets/entities/seat-placement.entity';

config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'nest_user',
      password: process.env.DB_PASSWORD || 'nest_password',
      database: process.env.DB_DATABASE || 'store_db',
      entities: [
        UserEntity,
        TicketEntity,
        EventEntity,
        BenefitEntity,
        SeatPlacementEntity,
      ],
      synchronize: true, // Для лабораторної роботи синхронізуємо моделі автоматично
    }),
    TicketsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
