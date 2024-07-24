import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForgetToken } from './entities/forget-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  constructor(
    @InjectRepository(ForgetToken)
    private forgetTokenRepository: Repository<ForgetToken>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}
  async forgetPassword(email: string) {
    this.logger.log(`Attempting to forget password for user: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Forget password attempt failed: No user found with email ${email}`,
      );
      throw new UnauthorizedException('Invalid Email');
    }
    const token = uuidv4();
    const forgetToken = this.forgetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const savedToken = await this.forgetTokenRepository.save(forgetToken);
    await this.mailService.sendForgetPasswordEmail(email, token);
  }
  async resetPassword(password: string, token: string) {
    try {
      const findToken = await this.forgetTokenRepository.findOne({
        where: { token },
        relations: ['user'],
      });

      if (!findToken) {
        this.logger.warn(`Invalid token attempt: ${token}`);
        throw new UnauthorizedException('Invalid token');
      }

      if (findToken.expiresAt < new Date()) {
        this.logger.warn(`Expired token attempt: ${token}`);
        throw new UnauthorizedException('Token expired');
      }

      const user = findToken.user;

      const isMatched = await this.authService.comparePassword(
        user.password,
        password,
      );

      if (isMatched) {
        this.logger.warn(
          `Password reset attempt with same password: User ID ${user.id}`,
        );
        throw new BadRequestException(
          'New password must be different from the current one',
        );
      }

      const hashedPassword = await this.authService.hashPassword(password);

      const updatedUser = await this.usersService.updatePassword(
        user,
        hashedPassword,
      );

      if (!updatedUser) {
        throw new InternalServerErrorException('Failed to update password');
      }

      await this.forgetTokenRepository.delete(findToken.id);

      this.logger.log(`Password reset successful for user: ${user.id}`);
      return { message: 'Password reset successful' };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred during password reset',
      );
    }
  }
}
