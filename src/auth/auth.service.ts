import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from './dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationToken } from '../users/entities/verification-token.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(VerificationToken)
    private verificationTokenRepository: Repository<VerificationToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  private generateToken(
    userId: string,
    username: string,
    email: string,
  ): string {
    const payload = { sub: userId, username, email };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
    });
  }

  async signup(createUserDto: CreateUserDto) {
    const { email, username, password } = createUserDto;

    this.logger.log(`Checking if email ${email} already exists`);
    const emailExists = await this.usersService.findByEmail(email);
    if (emailExists) {
      this.logger.warn(`Email ${email} already exists`);
      throw new ConflictException('Email already exists!');
    }

    this.logger.log(`Checking if username ${username} already exists`);
    const usernameExists = await this.usersService.findByUsername(username);
    if (usernameExists) {
      this.logger.warn(`Username ${username} already exists`);
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    try {
      this.logger.log(`Creating new user with email ${email}`);
      const savedUser = await this.usersService.create({
        email,
        username,
        password: hashedPassword,
      });
      this.logger.log(`User with email ${email} created successfully`);
      const token = this.generateVerificationToken();
      const verificationToken = this.verificationTokenRepository.create({
        userId: savedUser.id,
        token,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      await this.verificationTokenRepository.save(verificationToken);

      await this.mailService.sendVerificationEmail(email, token);

      return {
        message:
          'User created successfully. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create user with email ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    this.logger.log(`Attempting login for user with email ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Login attempt failed: No user found with email ${email}`,
      );
      throw new UnauthorizedException('Invalid Email or password!!');
    }

    this.logger.log(`User found, verifying password for ${email}`);
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Login attempt failed: Invalid password for user ${email}`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = this.generateToken(user.id, user.username, user.email);
    this.logger.log(`Login successful for user ${email}`);
    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email, username: user.username },
      access_token: token,
    };
  }
}
