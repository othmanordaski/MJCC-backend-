import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgetToken } from './entities/forget-token.entity';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { RestPasswordController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForgetToken]),
    forwardRef(() => UsersModule),
    MailModule,
  ],
  controllers: [RestPasswordController],
  providers: [PasswordResetService],
  exports: [TypeOrmModule],
})
export class PasswordResetModule {}
