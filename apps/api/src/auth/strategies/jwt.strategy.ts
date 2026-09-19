import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AUTH_COOKIE_NAME } from '@erp/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies[AUTH_COOKIE_NAME];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    });
  }

  async validate(payload: any) {
    // Payload properties match what was generated in auth.service.ts
    return { userId: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
  }
}
