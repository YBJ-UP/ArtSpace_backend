import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import perfilRoutes from './routes/perfil.routes'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors())
app.use(express.json())
// Rutas
// Rutas
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/usuarios', perfilRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'ArtSpace API funcionando' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})