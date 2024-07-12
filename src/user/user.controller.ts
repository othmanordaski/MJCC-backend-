import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}
  @Post('signup')
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(
      `Attempting to create user with email: ${createUserDto.email}`,
    );
    try {
      const result = await this.userService.create(createUserDto);
      this.logger.log(`User created successfully: ${result.user.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
