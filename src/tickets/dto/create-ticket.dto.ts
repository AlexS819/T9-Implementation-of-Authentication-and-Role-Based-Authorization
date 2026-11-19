import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SeatPlacementDto {
  @IsString()
  @MaxLength(50)
  row: string;

  @IsString()
  @MaxLength(50)
  entranceGate: string;

  @IsOptional()
  @IsString()
  viewNotes?: string;

  @IsOptional()
  @IsBoolean()
  hasReducedMobilityAccess?: boolean;
}

export class CreateTicketDto {
  @IsString()
  @MaxLength(150)
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @MaxLength(150)
  venue: string;

  @IsNumber()
  sector: number;

  @IsNumber()
  seatNumber: number;

  @IsOptional()
  @IsBoolean()
  isSold?: boolean;

  // Зв'язок 1:M - ID події
  @IsOptional()
  @IsUUID()
  eventId?: string;

  // Зв'язок M:N - список назв або об'єктів переваг
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefitNames?: string[];

  // Зв'язок 1:1 - деталі посадки
  @IsOptional()
  @ValidateNested()
  @Type(() => SeatPlacementDto)
  seatPlacement?: SeatPlacementDto;
}
