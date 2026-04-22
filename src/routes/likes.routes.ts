import { Router } from 'express'
import { darLike, quitarLike } from '../controllers/likes.controller'
import { verificarToken } from '../middlewares/auth'

const router = Router({ mergeParams: true })

router.post('/', verificarToken, darLike)
router.delete('/', verificarToken, quitarLike)

export default router