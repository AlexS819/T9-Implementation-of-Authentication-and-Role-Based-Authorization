import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../users/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<UserEntity, 'passwordHash' | 'hashedRefreshToken'>> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
    });

    const { passwordHash: _, hashedRefreshToken: __, ...result } = user;
    return result;
  }

  async login(
    dto: LoginDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Невірні облікові дані');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Невірні облікові дані');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.updateRefreshTokenHash(user.id, refreshToken);
    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken };
  }

  async refreshTokens(
    refreshToken: string | undefined,
    res: Response,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token відсутній');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_lab9',
      });
    } catch {
      throw new UnauthorizedException('Недійсний або прострочений refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Доступ заборонено або сесія завершена');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Недійсний refresh token');
    }

    const tokens = await this.generateTokens(user);

    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  async logout(userId: string, res: Response): Promise<{ message: string }> {
    await this.usersService.updateRefreshToken(userId, null);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/auth',
    });
    return { message: 'Успішний вихід із системи' };
  }

  async getProfile(userId: string): Promise<Omit<UserEntity, 'passwordHash' | 'hashedRefreshToken'>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    const { passwordHash: _, hashedRefreshToken: __, ...result } = user;
    return result;
  }

  private async generateTokens(user: UserEntity): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_lab9',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_lab9',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, this.saltRounds);
    await this.usersService.updateRefreshToken(userId, hash);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });
  }
}
