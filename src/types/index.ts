export interface Usuario {
  id_usuario: number
  nombre: string
  correo: string
  password: string
  rol: 'usuario' | 'artista' | 'admin'
  activo: boolean
  fecha_registro: Date
}

export interface JwtPayload {
  id_usuario: number
  correo: string
  rol: string
}