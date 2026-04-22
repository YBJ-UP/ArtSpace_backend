import { Router } from 'express'
import {
  crearObra,
  obtenerObras,
  obtenerObraDetalle,
  editarObra,
  eliminarObra,
  obtenerObrasFeed
} from '../controllers/obras.controller'
import { verificarToken } from '../middlewares/auth'
import { upload } from '../middlewares/upload'

const router = Router()

router.get('/feed', verificarToken, obtenerObrasFeed)
router.get('/', verificarToken, obtenerObras)
router.get('/:id', verificarToken, obtenerObraDetalle)
router.post('/', verificarToken, upload.single('imagen'), crearObra)
router.put('/:id', verificarToken, editarObra)
router.delete('/:id', verificarToken, eliminarObra)

export default router