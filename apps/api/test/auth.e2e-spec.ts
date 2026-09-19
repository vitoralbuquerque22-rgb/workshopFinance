import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { prisma } from '@erp/database';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { AUTH_COOKIE_NAME } from '@erp/shared';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let testEmpresa: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    
    // Seed db
    testEmpresa = await prisma.empresa.create({
      data: {
        nome: 'Auth Test Company',
        documento: '12345678901234',
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@authe2e.com',
        password: hashedPassword,
        empresaId: testEmpresa.id,
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@authe2e.com' }});
    await prisma.empresa.deleteMany({ where: { documento: '12345678901234' }});
    await app.close();
  });

  let authCookie: string;

  it('/auth/login (POST) - valid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@authe2e.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toBe('Logged in successfully');
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const authCookieStr = cookies.find(c => c.startsWith(`${AUTH_COOKIE_NAME}=`));
        expect(authCookieStr).toBeDefined();
        expect(authCookieStr).toContain('HttpOnly');
        authCookie = authCookieStr.split(';')[0]; // Extract just the cookie part
      });
  });

  it('/auth/login (POST) - invalid password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@authe2e.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/me (GET) - without session', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('/auth/me (GET) - with valid session', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', authCookie)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('test@authe2e.com');
        expect(res.body.empresaId).toBe(testEmpresa.id);
        // Ensure password is not returned
        expect(res.body.password).toBeUndefined();
      });
  });

  it('/auth/logout (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/logout')
      .expect(201)
      .expect((res) => {
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const authCookieStr = cookies.find(c => c.startsWith(`${AUTH_COOKIE_NAME}=`));
        expect(authCookieStr).toBeDefined();
        expect(authCookieStr).toContain('Expires='); // Usually indicates clearing
      });
  });
});
