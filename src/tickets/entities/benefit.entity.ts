import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('benefits')
export class BenefitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @ManyToMany(() => TicketEntity, (ticket) => ticket.benefits)
  tickets: TicketEntity[];
}

