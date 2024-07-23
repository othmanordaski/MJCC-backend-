import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetModule } from '../reset-password/password-reset.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationToken]),
    forwardRef(() => PasswordResetModule),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
