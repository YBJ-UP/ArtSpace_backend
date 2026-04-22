import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import perfilRoutes from './routes/perfil.routes'
import obrasRoutes from './routes/obras.routes'
import likesRoutes from './routes/likes.routes'
import comentariosRoutes from './routes/comentarios.routes'
import seguidoresRoutes from './routes/seguidores.routes'
import adminRoutes from './routes/admin.routes'



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
app.use('/api/v1/obras', obrasRoutes)
app.use('/api/v1/obras/:id/likes', likesRoutes)
app.use('/api/v1/obras/:id/comentarios', comentariosRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/usuarios', seguidoresRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'ArtSpace API funcionando' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})