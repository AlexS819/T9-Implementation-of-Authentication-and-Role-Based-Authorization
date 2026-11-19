import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('seat_placements')
export class SeatPlacementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  row: string;

  @Column({ type: 'varchar', length: 50 })
  entranceGate: string;

  @Column({ type: 'text', nullable: true })
  viewNotes: string;

  @Column({ type: 'boolean', default: false })
  hasReducedMobilityAccess: boolean;

  @OneToOne(() => TicketEntity, (ticket) => ticket.seatPlacement, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;
}

