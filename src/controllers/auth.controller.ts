import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../services/db'

export const registro = async (req: Request, res: Response) => {
  const { nombre, correo, password } = req.body

  try {
    // Verificar que no exista el correo
    const existe = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = $1',
      [correo]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }

    // Hashear la contraseña
    const hash = await bcrypt.hash(password, 10)

    // Insertar usuario
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, correo, rol`,
      [nombre, correo, hash]
    )

    const usuario = resultado.rows[0]

    // Crear perfil vacío automáticamente
    await pool.query(
      'INSERT INTO perfiles (id_usuario) VALUES ($1)',
      [usuario.id_usuario]
    )

    // Generar token
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.status(201).json({ usuario, token })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

export const login = async (req: Request, res: Response) => {
  const { correo, password } = req.body

  try {
    // Buscar usuario
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    )

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    const usuario = resultado.rows[0]

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password)
    if (!passwordValido) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    // Generar token
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
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}