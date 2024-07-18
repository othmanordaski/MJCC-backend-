import { Controller, Post, Body, Logger, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { CreateUserDto, LoginUserDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  private setCookie(res: Response, token: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAge:
        parseInt(this.configService.get<string>('JWT_EXPIRATION') || '3600') *
        1000,
      path: '/',
    };
    res.cookie('jwt', token, cookieOptions);
  }
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    this.logger.log(
      `Attempting to create user with email: ${createUserDto.email}`,
    );
    try {
      const result = await this.authService.signup(createUserDto);
      this.logger.log(`User created successfully: ${createUserDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Attempting login for user: ${loginUserDto.email}`);
    try {
      const result = await this.authService.login(loginUserDto);
      this.logger.log(`Login successful for user: ${loginUserDto.email}`);
      this.setCookie(res, result.access_token);
      return result;
    } catch (error) {
      this.logger.error(
        `Login failed for user ${loginUserDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
