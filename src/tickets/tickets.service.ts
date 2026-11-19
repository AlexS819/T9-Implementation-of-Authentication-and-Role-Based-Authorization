import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { TicketEntity } from './entities/ticket.entity';
import { EventEntity } from './entities/event.entity';
import { BenefitEntity } from './entities/benefit.entity';
import { SeatPlacementEntity } from './entities/seat-placement.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(BenefitEntity)
    private readonly benefitRepository: Repository<BenefitEntity>,
    @InjectRepository(SeatPlacementEntity)
    private readonly seatPlacementRepository: Repository<SeatPlacementEntity>,
    private readonly dataSource: DataSource,
  ) { }

  // Допоміжний метод створення події
  async createEvent(dto: CreateEventDto): Promise<EventEntity> {
    const event = this.eventRepository.create({
      title: dto.title,
      location: dto.location,
      eventDate: new Date(dto.eventDate),
    });
    return await this.eventRepository.save(event);
  }

  async findAllEvents(): Promise<EventEntity[]> {
    return await this.eventRepository.find({ relations: ['tickets'] });
  }

  // Рівень 1: Отримання квитка з пов'язаною подією (1:M / M:1) через relations
  async findOneWithRelations(id: string): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['event'],
    });
    if (!ticket) {
      throw new NotFoundException(`Квиток із ID "${id}" не знайдено`);
    }
    return ticket;
  }

  // Рівень 2: Фільтрація квитків за назвою переваги (Benefit) або назвою події через QueryBuilder
  async findTicketsWithFilters(benefitName?: string, eventTitle?: string) {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.benefits', 'benefit')
      .leftJoinAndSelect('ticket.seatPlacement', 'seatPlacement');

    if (benefitName) {
      query.andWhere('benefit.name ILIKE :benefitName', {
        benefitName: `%${benefitName}%`,
      });
    }

    if (eventTitle) {
      query.andWhere('event.title ILIKE :eventTitle', {
        eventTitle: `%${eventTitle}%`,
      });
    }

    return await query.getMany();
  }

  // Рівень 3: Вибірка повного агрегата через QueryBuilder (1:1, 1:M, M:N одночасно)
  async findFullAggregate(id: string): Promise<TicketEntity> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.benefits', 'benefit')
      .leftJoinAndSelect('ticket.seatPlacement', 'seatPlacement')
      .where('ticket.id = :id', { id });

    const ticket = await query.getOne();
    if (!ticket) {
      throw new NotFoundException(`Квиток із ID "${id}" не знайдено`);
    }
    return ticket;
  }

  // Рівень 3: Створення квитка в межах єдиної транзакції (DataSource.transaction)
  // з можливістю емуляції помилки для тестування відкату (rollback)
  async createTransactional(dto: CreateTicketDto, simulateFailure = false) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Пошук події, якщо передано eventId
      let event: EventEntity | null = null;
      if (dto.eventId) {
        event = await manager.findOne(EventEntity, {
          where: { id: dto.eventId },
        });
        if (!event) {
          throw new NotFoundException(
            `Подію з ID "${dto.eventId}" не знайдено`,
          );
        }
      }

      // 2. Обробка списку переваг (M:N)
      const benefits: BenefitEntity[] = [];
      if (dto.benefitNames && dto.benefitNames.length > 0) {
        for (const name of dto.benefitNames) {
          let b = await manager.findOne(BenefitEntity, { where: { name } });
          if (!b) {
            b = manager.create(BenefitEntity, { name });
            b = await manager.save(b);
          }
          benefits.push(b);
        }
      }

      // 3. Створення та збереження базової сутності TicketEntity
      const ticket = manager.create(TicketEntity, {
        title: dto.title,
        price: dto.price,
        venue: dto.venue,
        sector: dto.sector,
        seatNumber: dto.seatNumber,
        isSold: dto.isSold ?? false,
        event: event,
        benefits: benefits,
      });

      const savedTicket = await manager.save(ticket);

      // 4. Створення та збереження сутності 1:1 (SeatPlacementEntity)
      if (dto.seatPlacement) {
        const placement = manager.create(SeatPlacementEntity, {
          row: dto.seatPlacement.row,
          entranceGate: dto.seatPlacement.entranceGate,
          viewNotes: dto.seatPlacement.viewNotes,
          hasReducedMobilityAccess:
            dto.seatPlacement.hasReducedMobilityAccess ?? false,
          ticket: savedTicket,
        });
        await manager.save(placement);
      }

      // 5. Емуляція збою для демонстрації відкату (Rollback)
      if (simulateFailure || dto.price < 0) {
        throw new BadRequestException(
          "Ціна не може бути від'ємною або збій операції. Транзакцію успішно відкочено!",
        );
      }

      return savedTicket;
    });
  }

  // Стандартний CRUD (сумісність із попередніми завданнями)
  async create(dto: CreateTicketDto): Promise<TicketEntity> {
    return await this.createTransactional(dto, false);
  }

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const [data, total] = await this.ticketRepository.findAndCount({
      relations: ['event', 'benefits', 'seatPlacement'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<TicketEntity> {
    return await this.findFullAggregate(id);
  }

  async update(id: string, dto: UpdateTicketDto): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Квиток із ID "${id}" не знайдено`);
    }
    Object.assign(ticket, dto);
    return await this.ticketRepository.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Квиток із ID "${id}" не знайдено`);
    }
    await this.ticketRepository.remove(ticket);
  }
}
