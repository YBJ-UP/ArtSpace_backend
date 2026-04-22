import { Router } from 'express'
import {
  obtenerUsuarios,
  cambiarRolUsuario,
  eliminarUsuario,
  obtenerTodasLasObras,
  obtenerTodosLosComentarios,
  obtenerCategorias,
  crearCategoria,
  crearSubcategoria,
  eliminarCategoria
} from '../controllers/admin.controller'
import { verificarToken, soloAdmin } from '../middlewares/auth'

const router = Router()

// Todas las rutas de admin requieren token y rol admin
router.use(verificarToken, soloAdmin)

// Usuarios
router.get('/usuarios', obtenerUsuarios)
router.put('/usuarios/:id/rol', cambiarRolUsuario)
router.delete('/usuarios/:id', eliminarUsuario)

// Obras
router.get('/obras', obtenerTodasLasObras)

// Comentarios
router.get('/comentarios', obtenerTodosLosComentarios)

// Categorías
router.get('/categorias', obtenerCategorias)
router.post('/categorias', crearCategoria)
router.post('/categorias/subcategorias', crearSubcategoria)
router.delete('/categorias/:id', eliminarCategoria)

export default router