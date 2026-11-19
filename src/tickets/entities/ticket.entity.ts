import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { BenefitEntity } from './benefit.entity';
import { SeatPlacementEntity } from './seat-placement.entity';

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 150 })
  venue: string;

  @Column({ type: 'integer' })
  sector: number;

  @Column({ type: 'integer' })
  seatNumber: number;

  @Column({ type: 'boolean', default: false })
  isSold: boolean;

  // 1. Зв'язок One-to-Many / Many-to-One: Квиток -> Подія / Концерт
  @ManyToOne(() => EventEntity, (event) => event.tickets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity | null;

  // 2. Зв'язок Many-to-Many: Квиток <-> Переваги (VIP, Welcome Drink тощо)
  @ManyToMany(() => BenefitEntity, (benefit) => benefit.tickets, {
    cascade: true,
  })
  @JoinTable({
    name: 'ticket_benefits',
    joinColumn: { name: 'ticket_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'benefit_id', referencedColumnName: 'id' },
  })
  benefits: BenefitEntity[];

  // 3. Зв'язок One-to-One: Квиток <-> Схема/деталі посадки
  @OneToOne(() => SeatPlacementEntity, (placement) => placement.ticket, {
    cascade: true,
  })
  seatPlacement: SeatPlacementEntity | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
