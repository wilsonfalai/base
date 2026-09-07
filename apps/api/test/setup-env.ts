import { config } from 'dotenv';

config({ path: '../../.env', quiet: true });
config({ path: '.env', override: true, quiet: true });
