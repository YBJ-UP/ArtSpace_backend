import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import pool from '../services/db'

const schemaRegistro = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  correo: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

const schemaLogin = z.object({
  correo: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
})

export const registro = async (req: Request, res: Response) => {
  const validacion = schemaRegistro.safeParse(req.body)
  if (!validacion.success) {
    return res.status(400).json({ errores: z.flattenError(validacion.error).fieldErrors })
  }

  const { nombre, correo, password } = validacion.data

  try {
    const existe = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = $1',
      [correo]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }

    const hash = await bcrypt.hash(password, 10)

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, correo, rol`,
      [nombre, correo, hash]
    )

    const usuario = resultado.rows[0]

    await pool.query(
      'INSERT INTO perfiles (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING',
      [usuario.id_usuario]
    )

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.status(201).json({ usuario, token })
  } catch (error) {
    console.error('Error registro:', error)
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const login = async (req: Request, res: Response) => {
  const validacion = schemaLogin.safeParse(req.body)
  if (!validacion.success) {
    return res.status(400).json({ errores: z.flattenError(validacion.error).fieldErrors })
  }

  const { correo, password } = validacion.data

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    )

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    const usuario = resultado.rows[0]

    const passwordValido = await bcrypt.compare(password, usuario.password)
    if (!passwordValido) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.json({
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      },
      token
    })
  } catch (error) {
    console.error('Error login:', error)
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}
