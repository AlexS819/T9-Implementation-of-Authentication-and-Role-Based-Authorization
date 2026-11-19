import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString({ message: 'Назва події має бути рядком' })
  @IsNotEmpty({ message: 'Назва події не може бути порожньою' })
  title?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Ціна має бути числовим значенням' })
  @Min(0, { message: 'Ціна квитка не може бути від\'ємною' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Місце проведення має бути рядком' })
  @IsNotEmpty({ message: 'Місце проведення не може бути порожнім' })
  venue?: string;

  @IsOptional()
  @IsInt({ message: 'Сектор повинен бути цілим числом' })
  @Min(1, { message: 'Номер сектора повинен бути не менше 1' })
  sector?: number;

  @IsOptional()
  @IsInt({ message: 'Номер місця повинен бути цілим числом' })
  @Min(1, { message: 'Номер місця повинен бути не менше 1' })
  seatNumber?: number;

  @IsOptional()
  @IsBoolean({ message: 'Статус продажу повинен бути булевим значенням' })
  isSold?: boolean;
}

