import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    this.logger.log(
      `Attempting to create user with email: ${createUserDto.email}`,
    );
    try {
      const result = await this.authService.signup(createUserDto);
      this.logger.log(`User created successfully: ${result.user.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    this.logger.log(`Attempting login for user: ${loginUserDto.email}`);
    try {
      const result = await this.authService.login(loginUserDto);
      this.logger.log(`Login successful for user: ${loginUserDto.email}`);
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
