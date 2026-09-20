import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createAuth } from '@base-app/auth';
import {
  createPrismaClient,
  type DatabaseClient,
} from '@base-app/database';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let database: DatabaseClient;
  let sessionCookie: string;

  const testUser = {
    email: 'api.e2e@base-app.local',
    name: 'API E2E User',
    password: 'Api-e2e-only-password-123!',
  };

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    const baseURL = process.env.BETTER_AUTH_URL;
    const secret = process.env.BETTER_AUTH_SECRET;

    if (!databaseUrl || !baseURL || !secret) {
      throw new Error('Authentication test environment is incomplete');
    }

    database = createPrismaClient(databaseUrl);
    const auth = createAuth({
      baseURL,
      database,
      disableSignUp: false,
      secret,
    });

    await database.user.deleteMany({ where: { email: testUser.email } });
    const signUp = await auth.api.signUpEmail({
      body: testUser,
      returnHeaders: true,
    });

    const setCookie = signUp.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('Better Auth did not return the session cookie');
    }

    sessionCookie = setCookie;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ok', checks: { database: 'up' } });
  });

  it('/auth/session (GET) rejects anonymous requests', () => {
    return request(app.getHttpServer()).get('/auth/session').expect(401);
  });

  it('/auth/session (GET) returns the authenticated user without the token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      user: { email: testUser.email, name: testUser.name },
      session: { id: expect.any(String), expiresAt: expect.any(String) },
    });
    expect(response.body.session).not.toHaveProperty('token');
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await database.user.deleteMany({ where: { email: testUser.email } });
    await database.$disconnect();
  });
});
