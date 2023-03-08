// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  interface Transaction {
    id: string
    title: string
    amount: number
    created_at: string
    session_id?: string
  }

  export interface Tables {
    transactions: Transaction
  }
}
