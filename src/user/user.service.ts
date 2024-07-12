import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
@Injectable()
export class UserService {
  private readonly saltRounds = 12;
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }
  async findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async create(createUserDto: CreateUserDto) {
    const { email, username, password } = createUserDto;

    this.logger.log(`Checking if email ${email} already exists`);
    const emailExists = await this.findByEmail(email);
    if (emailExists) {
      this.logger.warn(`Email ${email} already exists`);
      throw new ConflictException('Email already exists!');
    }

    this.logger.log(`Checking if username ${username} already exists`);
    const usernameExists = await this.findByUsername(username);
    if (usernameExists) {
      this.logger.warn(`Username ${username} already exists`);
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    try {
      this.logger.log(`Saving new user with email ${email}`);
      await this.userRepository.save(user);
      this.logger.log(`User with email ${email} created successfully`);
      return { message: 'Successfully created your account', user };
    } catch (error) {
      this.logger.error(
        `Failed to create user with email ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
