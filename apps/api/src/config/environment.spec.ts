import { validateEnvironment } from './environment.js';

const validEnvironment = {
  BETTER_AUTH_SECRET: 'test-only-secret-with-at-least-32-characters',
  BETTER_AUTH_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateEnvironment', () => {
  it('applies safe local defaults', () => {
    const environment = validateEnvironment(validEnvironment);

    expect(environment.NODE_ENV).toBe('development');
    expect(environment.PORT).toBe(3001);
  });

  it('coerces a valid port', () => {
    const environment = validateEnvironment({
      ...validEnvironment,
      DATABASE_URL: 'postgres://user:password@localhost:5432/database',
      PORT: '4000',
    });

    expect(environment.PORT).toBe(4000);
  });

  it('rejects missing or non-PostgreSQL database URLs', () => {
    expect(() => validateEnvironment({})).toThrow('Invalid environment');
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        DATABASE_URL: 'mysql://localhost/database',
      }),
    ).toThrow('Invalid environment');
  });

  it('rejects an unsafe authentication secret', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        BETTER_AUTH_SECRET: 'too-short',
      }),
    ).toThrow('Invalid environment');
  });
});
