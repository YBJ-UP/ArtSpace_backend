import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'

export const obtenerUsuarios = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.fecha_registro,
              COUNT(DISTINCT o.id_obra) AS total_obras
       FROM usuarios u
       LEFT JOIN obras o ON u.id_usuario = o.id_usuario
       GROUP BY u.id_usuario
       ORDER BY u.fecha_registro DESC`
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const cambiarRolUsuario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string
  const { rol } = req.body

  try {
    if (!['usuario', 'artista', 'admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET rol = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, nombre, correo, rol`,
      [rol, id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const eliminarUsuario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    // No puede eliminarse a sí mismo
    if (parseInt(id) === req.usuario!.id_usuario) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
    }

    const resultado = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario',
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerTodasLasObras = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT vw.*, o.id_usuario
       FROM vw_detalles_obra vw
       JOIN obras o ON vw.id_obra = o.id_obra
       ORDER BY vw.fecha_publicacion DESC`
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerTodosLosComentarios = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT c.id_comentario, c.contenido, c.fecha,
              u.nombre AS autor, u.id_usuario,
              o.titulo AS obra, o.id_obra
       FROM comentarios c
       JOIN usuarios u ON c.id_usuario = u.id_usuario
       JOIN obras o ON c.id_obra = o.id_obra
       ORDER BY c.fecha DESC`
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerCategorias = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT c.id_categoria, c.nombre,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id_subcategoria', s.id_subcategoria,
                    'nombre', s.nombre
                  )
                ) FILTER (WHERE s.id_subcategoria IS NOT NULL), '[]'
              ) AS subcategorias
       FROM categorias c
       LEFT JOIN subcategorias s ON c.id_categoria = s.id_categoria
       GROUP BY c.id_categoria
       ORDER BY c.nombre`
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const crearCategoria = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { nombre } = req.body

  try {
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const resultado = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
      [nombre]
    )

    return res.status(201).json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const crearSubcategoria = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { nombre, id_categoria } = req.body

  try {
    if (!nombre || !id_categoria) {
      return res.status(400).json({ error: 'Nombre e id_categoria son requeridos' })
    }

    const resultado = await pool.query(
      'INSERT INTO subcategorias (nombre, id_categoria) VALUES ($1, $2) RETURNING *',
      [nombre, id_categoria]
    )

    return res.status(201).json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const cambiarEstadoUsuario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string
  const { activo } = req.body

  try {
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo activo debe ser true o false' })
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET activo = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, nombre, correo, rol, activo`,
      [activo, id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const eliminarCategoria = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const resultado = await pool.query(
      'DELETE FROM categorias WHERE id_categoria = $1 RETURNING id_categoria',
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    return res.json({ mensaje: 'Categoría eliminada correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}