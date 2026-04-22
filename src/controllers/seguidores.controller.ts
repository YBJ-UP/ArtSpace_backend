import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'

export const seguirUsuario = async (req: RequestConUsuario, res: Response) => {
  const id = req.params.id as string

  try {
    // No puedes seguirte a ti mismo
    if (parseInt(id) === req.usuario!.id_usuario) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' })
    }

    // Verificar que el usuario existe
    const usuario = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = $1',
      [id]
    )

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Verificar que no lo sigue ya
    const yaSignue = await pool.query(
      'SELECT id_seguidor FROM seguidores WHERE usuario_origen = $1 AND usuario_destino = $2',
      [req.usuario!.id_usuario, id]
    )

    if (yaSignue.rows.length > 0) {
      return res.status(400).json({ error: 'Ya sigues a este usuario' })
    }

    await pool.query(
      'INSERT INTO seguidores (usuario_origen, usuario_destino) VALUES ($1, $2)',
      [req.usuario!.id_usuario, id]
    )

    return res.status(201).json({ mensaje: 'Ahora sigues a este usuario' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const dejarDeSeguir = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const resultado = await pool.query(
      `DELETE FROM seguidores
       WHERE usuario_origen = $1 AND usuario_destino = $2
       RETURNING id_seguidor`,
      [req.usuario!.id_usuario, id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'No sigues a este usuario' })
    }

    return res.json({ mensaje: 'Dejaste de seguir a este usuario' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerSeguidores = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const resultado = await pool.query(
      `SELECT u.id_usuario, u.nombre, p.avatar
       FROM seguidores s
       JOIN usuarios u ON s.usuario_origen = u.id_usuario
       LEFT JOIN perfiles p ON u.id_usuario = p.id_usuario
       WHERE s.usuario_destino = $1
       ORDER BY s.fecha DESC`,
      [id]
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerSiguiendo = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const resultado = await pool.query(
      `SELECT u.id_usuario, u.nombre, p.avatar
       FROM seguidores s
       JOIN usuarios u ON s.usuario_destino = u.id_usuario
       LEFT JOIN perfiles p ON u.id_usuario = p.id_usuario
       WHERE s.usuario_origen = $1
       ORDER BY s.fecha DESC`,
      [id]
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}