import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL'))
  .catch((err) => console.error('Error al conectar a DB:', err))

export default pool