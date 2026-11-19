import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'varchar', length: 200 })
  location: string;

  @Column({ type: 'timestamp with time zone' })
  eventDate: Date;

  @OneToMany(() => TicketEntity, (ticket) => ticket.event)
  tickets: TicketEntity[];
}

