import { Router } from 'express'
import {
  seguirUsuario,
  dejarDeSeguir,
  obtenerSeguidores,
  obtenerSiguiendo
} from '../controllers/seguidores.controller'
import { verificarToken } from '../middlewares/auth'

const router = Router()

router.post('/:id/seguir', verificarToken, seguirUsuario)
router.delete('/:id/seguir', verificarToken, dejarDeSeguir)
router.get('/:id/seguidores', verificarToken, obtenerSeguidores)
router.get('/:id/siguiendo', verificarToken, obtenerSiguiendo)

export default router