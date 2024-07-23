import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RequestResetDto } from './dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
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
}
