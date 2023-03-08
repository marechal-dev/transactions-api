import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const sessionId = request.cookies.sessionId

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return {
        transactions,
      }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const sessionId = request.cookies.sessionId

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', {
          as: 'amount',
        })
        .first()

      return {
        summary,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const parseResult = getTransactionParamsSchema.safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          status: 'Bad Request',
          message: 'Invalid Transaction ID.',
        })
      }

      const { id } = parseResult.data

      const sessionId = request.cookies.sessionId

      const transaction = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({
          status: 'Not Found',
          message: 'Transaction not found.',
        })
      }

      return {
        transaction,
      }
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string().nonempty(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'] as const),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      const SEVEN_DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24 * 7

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: SEVEN_DAYS_IN_MILLISECONDS,
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
