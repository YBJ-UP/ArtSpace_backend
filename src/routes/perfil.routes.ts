import { Router } from 'express'
import {
  obtenerPerfilPropio,
  obtenerPerfilUsuario,
  editarPerfil
} from '../controllers/perfil.controller'
import { verificarToken } from '../middlewares/auth'
import { upload } from '../middlewares/upload'

const router = Router()

router.get('/me', verificarToken, obtenerPerfilPropio)
router.get('/:id', verificarToken, obtenerPerfilUsuario)
router.put('/me', verificarToken, upload.single('avatar'), editarPerfil)

export default router