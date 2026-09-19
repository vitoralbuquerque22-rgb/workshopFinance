import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@erp/database';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { empresa: true },
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async verifyUser(userId: string, tenantId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });
    if (!user || user.empresaId !== tenantId) {
      throw new UnauthorizedException('User or tenant no longer valid');
    }
    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.empresaId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
