import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types'

export interface RequestConUsuario extends Request {
  usuario?: JwtPayload
}

export const verificarToken = (
  req: RequestConUsuario,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.usuario = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export const soloAdmin = (
  req: RequestConUsuario,
  res: Response,
  next: NextFunction
) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' })
  }
  next()
}