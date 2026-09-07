import { validateEnvironment } from './environment.js';

describe('validateEnvironment', () => {
  it('applies safe local defaults', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
    });

    expect(environment.NODE_ENV).toBe('development');
    expect(environment.PORT).toBe(3001);
  });

  it('coerces a valid port', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgres://user:password@localhost:5432/database',
      PORT: '4000',
    });

    expect(environment.PORT).toBe(4000);
  });

  it('rejects missing or non-PostgreSQL database URLs', () => {
    expect(() => validateEnvironment({})).toThrow('Invalid environment');
    expect(() =>
      validateEnvironment({ DATABASE_URL: 'mysql://localhost/database' }),
    ).toThrow('Invalid environment');
  });
});
