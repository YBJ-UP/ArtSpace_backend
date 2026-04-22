import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'

export const darLike = async (req: RequestConUsuario, res: Response) => {
  const { id } = req.params

  try {
    // Verificar que la obra existe
    const obra = await pool.query(
      'SELECT id_obra FROM obras WHERE id_obra = $1',
      [id]
    )

    if (obra.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' })
    }

    // Verificar si ya dio like
    const likeExiste = await pool.query(
      'SELECT id_like FROM likes WHERE id_usuario = $1 AND id_obra = $2',
      [req.usuario!.id_usuario, id]
    )

    if (likeExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Ya diste like a esta obra' })
    }

    await pool.query(
      'INSERT INTO likes (id_usuario, id_obra) VALUES ($1, $2)',
      [req.usuario!.id_usuario, id]
    )

    // Retornar total de likes actualizado
    const total = await pool.query(
      'SELECT COUNT(*) AS likes_total FROM likes WHERE id_obra = $1',
      [id]
    )

    return res.status(201).json({
      mensaje: 'Like registrado',
      likes_total: parseInt(total.rows[0].likes_total)
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const quitarLike = async (req: RequestConUsuario, res: Response) => {
  const { id } = req.params

  try {
    const resultado = await pool.query(
      'DELETE FROM likes WHERE id_usuario = $1 AND id_obra = $2 RETURNING id_like',
      [req.usuario!.id_usuario, id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'No habías dado like a esta obra' })
    }

    const total = await pool.query(
      'SELECT COUNT(*) AS likes_total FROM likes WHERE id_obra = $1',
      [id]
    )

    return res.json({
      mensaje: 'Like eliminado',
      likes_total: parseInt(total.rows[0].likes_total)
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}