import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/auth'
import pool from '../services/db'
import cloudinary from '../services/cloudinary'

export const obtenerPerfilPropio = async (
  req: RequestConUsuario,
  res: Response
) => {
  try {
    const resultado = await pool.query(
      `SELECT * FROM vw_detalles_perfil WHERE correo = $1`,
      [req.usuario!.correo]
    )

    return res.json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const obtenerPerfilUsuario = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { id } = req.params

  try {
    const resultado = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.fecha_registro,
              p.biografia, p.avatar,
              COUNT(DISTINCT o.id_obra) AS total_obras,
              COUNT(DISTINCT s1.id_seguidor) AS seguidores,
              COUNT(DISTINCT s2.id_seguidor) AS siguiendo
       FROM usuarios u
       LEFT JOIN perfiles p ON u.id_usuario = p.id_usuario
       LEFT JOIN obras o ON u.id_usuario = o.id_usuario
       LEFT JOIN seguidores s1 ON u.id_usuario = s1.usuario_destino
       LEFT JOIN seguidores s2 ON u.id_usuario = s2.usuario_origen
       WHERE u.id_usuario = $1
       GROUP BY u.id_usuario, p.biografia, p.avatar`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json(resultado.rows[0])
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const editarPerfil = async (
  req: RequestConUsuario,
  res: Response
) => {
  const { nombre, biografia } = req.body
  const archivo = req.file

  try {
    let avatarUrl: string | undefined

    // Si mandaron imagen, subirla a Cloudinary
    if (archivo) {
      const resultado = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'artspace/avatares' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result!.secure_url)
          }
        ).end(archivo.buffer)
      })
      avatarUrl = resultado
    }

    // Actualizar nombre si se mandó
    if (nombre) {
      await pool.query(
        'UPDATE usuarios SET nombre = $1 WHERE id_usuario = $2',
        [nombre, req.usuario!.id_usuario]
      )
    }

    // Actualizar perfil
    const campos: string[] = []
    const valores: any[] = []
    let contador = 1

    if (biografia !== undefined) {
      campos.push(`biografia = $${contador}`)
      valores.push(biografia)
      contador++
    }

    if (avatarUrl) {
      campos.push(`avatar = $${contador}`)
      valores.push(avatarUrl)
      contador++
    }

    if (campos.length > 0) {
      valores.push(req.usuario!.id_usuario)
      await pool.query(
        `UPDATE perfiles SET ${campos.join(', ')} WHERE id_usuario = $${contador}`,
        valores
      )
    }

    return res.json({ mensaje: 'Perfil actualizado correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}