import { Router } from 'express'
import {
  comentar,
  responderComentario,
  eliminarComentario
} from '../controllers/comentarios.controller'
import { verificarToken } from '../middlewares/auth'

const router = Router({ mergeParams: true })

router.post('/', verificarToken, comentar)
router.post('/:idComentario/respuestas', verificarToken, responderComentario)
router.delete('/:idComentario', verificarToken, eliminarComentario)

export default router