import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { VerificationToken } from './entities/verification-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationToken)
    private tokenRepository: Repository<VerificationToken>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
  async findById(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }
  async findVerificationToken(token: string): Promise<VerificationToken> {
    return this.tokenRepository.findOne({ where: { token } });
  }
  async verifyUser(user: User): Promise<User> {
    user.isVerified = true;
    return this.userRepository.save(user);
  }
}
