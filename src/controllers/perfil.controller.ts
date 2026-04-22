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
  const id = req.params.id as string

  try {
    const usuarioRes = await pool.query(
      'SELECT correo FROM usuarios WHERE id_usuario = $1',
      [id]
    )

    if (usuarioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const resultado = await pool.query(
      `SELECT * FROM vw_detalles_perfil WHERE correo = $1`,
      [usuarioRes.rows[0].correo]
    )

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
    // Decirle a PostgreSQL quién es el usuario actual
    await pool.query(`SET app.current_user_id = '${req.usuario!.id_usuario}'`)

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
  console.error('Error editarPerfil:', error)
  return res.status(500).json({ error: String(error) })
}
}