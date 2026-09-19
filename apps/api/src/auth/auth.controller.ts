import { Controller, Request, Post, UseGuards, Get, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { AUTH_COOKIE_NAME } from '@erp/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { email, password } = req.body;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { access_token } = await this.authService.login(user);
    
    res.cookie(AUTH_COOKIE_NAME, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return { message: 'Logged in successfully' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // Validate identity from DB instead of trusting just the JWT
    const { userId, tenantId } = req.user;
    const verifiedUser = await this.authService.verifyUser(userId, tenantId);
    return verifiedUser;
  }
}
