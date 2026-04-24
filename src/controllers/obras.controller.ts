import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'
import cloudinary from '../services/cloudinary'

export const crearObra = async (req: RequestConUsuario, res: Response) => {
  const { titulo, descripcion, subcategorias } = req.body
  const archivo = req.file

  try {
    if (!archivo) {
      return res.status(400).json({ error: 'La imagen es requerida' })
    }

    // Subir imagen a Cloudinary
    const imagenUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'artspace/obras' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!.secure_url)
        }
      ).end(archivo.buffer)
    })

    // Insertar obra
    const obraResultado = await pool.query(
      `INSERT INTO obras (titulo, descripcion, id_usuario)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [titulo, descripcion, req.usuario!.id_usuario]
    )

    const obra = obraResultado.rows[0]

    // Insertar imagen en media
    await pool.query(
      `INSERT INTO media (archivo, tipo, id_obra)
       VALUES ($1, 'imagen', $2)`,
      [imagenUrl, obra.id_obra]
    )

    // Insertar subcategorías si se mandaron
    if (subcategorias && Array.isArray(subcategorias)) {
      for (const id_subcategoria of subcategorias) {
        await pool.query(
          `INSERT INTO obra_subcategoria (id_obra, id_subcategoria)
           VALUES ($1, $2)`,
          [obra.id_obra, id_subcategoria]
        )
      }
    }

    return res.status(201).json({ ...obra, imagen: imagenUrl })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerObras = async (req: RequestConUsuario, res: Response) => {
  const { categoria, subcategoria, busqueda } = req.query

  try {
    let query = `
      SELECT vw.*, o.id_usuario, m.archivo AS imagen
      FROM vw_detalles_obra vw
      JOIN obras o ON vw.id_obra = o.id_obra
      LEFT JOIN media m ON vw.id_obra = m.id_obra
    `

    const condiciones: string[] = []
    const valores: any[] = []
    let contador = 1

    if (categoria) {
      condiciones.push(`vw.categoria = $${contador}`)
      valores.push(categoria)
      contador++
    }

    if (subcategoria) {
      condiciones.push(`vw.subcategoria = $${contador}`)
      valores.push(subcategoria)
      contador++
    }

    if (busqueda) {
      condiciones.push(`(vw.titulo ILIKE $${contador} OR vw.autor ILIKE $${contador})`)
      valores.push(`%${busqueda}%`)
      contador++
    }

    if (condiciones.length > 0) {
      query += ` WHERE ${condiciones.join(' AND ')}`
    }

    query += ` ORDER BY vw.fecha_publicacion DESC`

    const resultado = await pool.query(query, valores)
    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerObraDetalle = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const obraResultado = await pool.query(
      `SELECT vw.*, o.id_usuario, m.archivo AS imagen
       FROM vw_detalles_obra vw
       JOIN obras o ON vw.id_obra = o.id_obra
       LEFT JOIN media m ON vw.id_obra = m.id_obra
       WHERE vw.id_obra = $1`,
      [id]
    )

    if (obraResultado.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' })
    }

    // Comentarios siguen igual porque la vista no los incluye
    const comentariosResultado = await pool.query(
      `SELECT c.id_comentario, c.contenido, c.fecha,
              u.nombre AS autor, u.id_usuario, p.avatar AS autor_avatar,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id_respuesta', r.id_respuesta,
                    'contenido', r.contenido,
                    'fecha', r.fecha,
                    'autor', ur.nombre,
                    'avatar', pr.avatar
                  )
                ) FILTER (WHERE r.id_respuesta IS NOT NULL), '[]'
              ) AS respuestas
       FROM comentarios c
       JOIN usuarios u ON c.id_usuario = u.id_usuario
       LEFT JOIN perfiles p ON u.id_usuario = p.id_usuario
       LEFT JOIN respuestas_comentario r ON c.id_comentario = r.id_comentario
       LEFT JOIN usuarios ur ON r.id_usuario = ur.id_usuario
       LEFT JOIN perfiles pr ON ur.id_usuario = pr.id_usuario
       WHERE c.id_obra = $1
       GROUP BY c.id_comentario, u.nombre, u.id_usuario, p.avatar
       ORDER BY c.fecha DESC`,
      [id]
    )

    return res.json({
      ...obraResultado.rows[0],
      comentarios: comentariosResultado.rows
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const editarObra = async (req: RequestConUsuario, res: Response) => {
  const id = req.params.id as string
  const { titulo, descripcion, subcategorias } = req.body
  const archivo = req.file

  try {
    const obra = await pool.query(
      'SELECT id_obra FROM obras WHERE id_obra = $1 AND id_usuario = $2',
      [id, req.usuario!.id_usuario]
    )

    if (obra.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta obra' })
    }

    const campos: string[] = []
    const valores: any[] = []
    let contador = 1

    if (titulo) {
      campos.push(`titulo = $${contador}`)
      valores.push(titulo)
      contador++
    }

    if (descripcion !== undefined) {
      campos.push(`descripcion = $${contador}`)
      valores.push(descripcion)
      contador++
    }

    if (campos.length > 0) {
      valores.push(id)
      await pool.query(
        `UPDATE obras SET ${campos.join(', ')} WHERE id_obra = $${contador}`,
        valores
      )
    }

    if (archivo) {
      const imagenUrl = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'artspace/obras' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result!.secure_url)
          }
        ).end(archivo.buffer)
      })

      await pool.query(
        `UPDATE media SET archivo = $1 WHERE id_obra = $2`,
        [imagenUrl, id]
      )
    }

    if (subcategorias && Array.isArray(subcategorias)) {
      await pool.query('DELETE FROM obra_subcategoria WHERE id_obra = $1', [id])
      for (const id_subcategoria of subcategorias) {
        await pool.query(
          'INSERT INTO obra_subcategoria (id_obra, id_subcategoria) VALUES ($1, $2)',
          [id, id_subcategoria]
        )
      }
    }

    return res.json({ mensaje: 'Obra actualizada correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const eliminarObra = async (req: RequestConUsuario, res: Response) => {
  const { id } = req.params

  try {
    await pool.query(`SET app.current_user_id = '${req.usuario!.id_usuario}'`)

    const obra = await pool.query(
      'SELECT id_obra, id_usuario FROM obras WHERE id_obra = $1',
      [id]
    )

    if (obra.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' })
    }

    const esOwner = obra.rows[0].id_usuario === req.usuario!.id_usuario
    const esAdmin = req.usuario!.rol === 'admin'

    if (!esOwner && !esAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta obra' })
    }

    await pool.query('DELETE FROM obras WHERE id_obra = $1', [id])

    return res.json({ mensaje: 'Obra eliminada correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerObrasPorUsuario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const id = req.params.id as string

  try {
    const resultado = await pool.query(
      `SELECT vw.*, o.id_usuario, m.archivo AS imagen
       FROM vw_detalles_obra vw
       JOIN obras o ON vw.id_obra = o.id_obra
       LEFT JOIN media m ON vw.id_obra = m.id_obra
       WHERE o.id_usuario = $1
       ORDER BY vw.fecha_publicacion DESC`,
      [id]
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerObrasFeed = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT o.id_obra, o.titulo, o.descripcion, o.fecha_publicacion,
              u.nombre AS autor, u.id_usuario,
              p.avatar AS autor_avatar,
              m.archivo AS imagen,
              COUNT(DISTINCT l.id_like) AS likes,
              COUNT(DISTINCT c.id_comentario) AS comentarios
       FROM obras o
       JOIN usuarios u ON o.id_usuario = u.id_usuario
       LEFT JOIN perfiles p ON u.id_usuario = p.id_usuario
       LEFT JOIN media m ON o.id_obra = m.id_obra
       LEFT JOIN likes l ON o.id_obra = l.id_obra
       LEFT JOIN comentarios c ON o.id_obra = c.id_obra
       WHERE o.id_usuario IN (
         SELECT usuario_destino FROM seguidores
         WHERE usuario_origen = $1
       )
       GROUP BY o.id_obra, u.nombre, u.id_usuario, p.avatar, m.archivo
       ORDER BY o.fecha_publicacion DESC`,
      [req.usuario!.id_usuario]
    )

    return res.json(resultado.rows)
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}