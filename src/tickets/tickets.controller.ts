import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('tickets')
@UseGuards(RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Публічний перегляд подій
  @Public()
  @Get('events')
  findAllEvents() {
    return this.ticketsService.findAllEvents();
  }

  // Привілейоване створення подій (ORGANIZER, ADMIN)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post('events')
  createEvent(@Body() dto: CreateEventDto) {
    return this.ticketsService.createEvent(dto);
  }

  // Привілейоване транзакційне створення квитка
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post('transactional')
  createTransactional(
    @Body() dto: CreateTicketDto,
    @Query('simulateFailure') simulateFailure?: string,
  ) {
    const fail = simulateFailure === 'true';
    return this.ticketsService.createTransactional(dto, fail);
  }

  // Публічний пошук із фільтрами
  @Public()
  @Get('search')
  findWithFilters(
    @Query('benefit') benefit?: string,
    @Query('eventTitle') eventTitle?: string,
  ) {
    return this.ticketsService.findTicketsWithFilters(benefit, eventTitle);
  }

  // Публічний перегляд детальних зв'язків
  @Public()
  @Get(':id/relations')
  findOneRelations(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOneWithRelations(id);
  }

  // Публічний перегляд повного агрегата
  @Public()
  @Get(':id/full')
  findFullAggregate(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findFullAggregate(id);
  }

  // Привілейоване створення квитка (ORGANIZER, ADMIN)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  // Публічний перегляд списку квитків
  @Public()
  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.ticketsService.findAll(pagination);
  }

  // Публічний перегляд конкретного квитка
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  // Привілейоване оновлення квитка (ORGANIZER, ADMIN)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, dto);
  }

  // Привілейоване видалення квитка (ORGANIZER, ADMIN)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
  }
}
