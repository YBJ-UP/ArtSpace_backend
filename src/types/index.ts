export interface Usuario {
  id_usuario: number
  nombre: string
  correo: string
  password: string
  rol: 'artista' | 'admin'
  fecha_registro: Date
}

export interface JwtPayload {
  id_usuario: number
  correo: string
  rol: string
}