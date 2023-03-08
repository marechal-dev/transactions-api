import { config } from 'dotenv'

import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({
    path: '.env.test',
  })
} else {
  config()
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'] as const)
    .default('production'),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg'] as const),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().nonempty(),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('⚠ Invalid Environment Variables.', _env.error.format())

  throw new Error('⚠ Invalid Environment Variables.')
}

export const env = _env.data
