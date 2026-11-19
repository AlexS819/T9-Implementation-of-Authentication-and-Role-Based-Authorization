import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Номер сторінки повинен бути цілим числом' })
  @Min(1, { message: 'Номер сторінки не може бути меншим за 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ліміт записів повинен бути цілим числом' })
  @Min(1, { message: 'Ліміт записів не може бути меншим за 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Пошуковий рядок має бути рядком' })
  search?: string;
}

