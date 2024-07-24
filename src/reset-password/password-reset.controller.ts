import {
  Controller,
  Body,
  Query,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { RequestResetDto, ResetPasswordDto } from './dto';
@ApiTags('Password Reset')
@Controller('reset-password')
export class RestPasswordController {
  constructor(private passwordResetService: PasswordResetService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  async reset(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query('token') queryToken?: string,
  ) {
    if (!queryToken) {
      return { message: 'Token is required' };
    }

    await this.passwordResetService.resetPassword(
      resetPasswordDto.password,
      queryToken,
    );
    return { message: 'Password reset successful' };
  }
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
