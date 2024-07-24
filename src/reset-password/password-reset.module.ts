import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgetToken } from './entities/forget-token.entity';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { RestPasswordController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForgetToken]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    MailModule,
  ],
  controllers: [RestPasswordController],
  providers: [PasswordResetService],
  exports: [TypeOrmModule],
})
export class PasswordResetModule {}
