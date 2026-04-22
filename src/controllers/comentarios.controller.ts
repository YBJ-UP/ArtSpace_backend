import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'

export const comentar = async (req: RequestConUsuario, res: Response) => {
  const { id } = req.params
  const { contenido } = req.body

  try {
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' })
    }

    const resultado = await pool.query(
      `INSERT INTO comentarios (contenido, id_usuario, id_obra)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [contenido, req.usuario!.id_usuario, id]
    )

    return res.status(201).json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const responderComentario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { idComentario } = req.params
  const { contenido } = req.body

  try {
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía' })
    }

    // Verificar que el comentario existe
    const comentario = await pool.query(
      'SELECT id_comentario FROM comentarios WHERE id_comentario = $1',
      [idComentario]
    )

    if (comentario.rows.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' })
    }

    const resultado = await pool.query(
      `INSERT INTO respuestas_comentario (contenido, id_usuario, id_comentario)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [contenido, req.usuario!.id_usuario, idComentario]
    )

    return res.status(201).json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const eliminarComentario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { idComentario } = req.params

  try {
    // Solo puede eliminar el autor del comentario o un admin
    const comentario = await pool.query(
      'SELECT id_usuario FROM comentarios WHERE id_comentario = $1',
      [idComentario]
    )

    if (comentario.rows.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' })
    }

    const esAutor = comentario.rows[0].id_usuario === req.usuario!.id_usuario
    const esAdmin = req.usuario!.rol === 'admin'

    if (!esAutor && !esAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' })
    }

    await pool.query(
      'DELETE FROM comentarios WHERE id_comentario = $1',
      [idComentario]
    )

    return res.json({ mensaje: 'Comentario eliminado' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}