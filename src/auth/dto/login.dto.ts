import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некоректний формат email' })
  @IsNotEmpty({ message: 'Email є обов’язковим' })
  email: string;

  @IsNotEmpty({ message: 'Пароль є обов’язковим' })
  password: string;
}
