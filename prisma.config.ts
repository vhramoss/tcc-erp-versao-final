import { defineConfig } from '@prisma/config';

declare const process: { env: { DATABASE_URL?: string } };

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});