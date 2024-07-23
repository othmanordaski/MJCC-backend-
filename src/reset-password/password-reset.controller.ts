import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { RequestResetDto } from './dto';
@ApiTags('Password Reset')
@Controller('reset-password')
export class RestPasswordController {
  constructor(private passwordResetService: PasswordResetService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password rest ' })
  @ApiResponse({
    status: 200,
    description: 'Rest email sent if the user exists',
  })
  async requestReset(@Body() requestResetDto: RequestResetDto) {
    await this.passwordResetService.forgetPassword(requestResetDto.email);
    return {
      message: 'If a user with that email exists, a reset link has been sent.',
    };
  }
}
