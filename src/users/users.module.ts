import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetModule } from '../reset-password/password-reset.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationToken]),
    forwardRef(() => PasswordResetModule),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
