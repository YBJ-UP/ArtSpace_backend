# ArtSpace — Backend

API REST para **ArtSpace**, una plataforma social para artistas donde pueden publicar obras, seguirse entre sí, comentar y dar likes.

---

## Arquitectura y separación de capas

```
ArtSpace_backend/
├── src/
│   ├── index.ts              # Punto de entrada, configuración de Express
│   ├── routes/               # Definición de rutas por recurso
│   ├── controllers/          # Lógica de negocio por recurso
│   ├── middlewares/          # Autenticación JWT y subida de archivos
│   ├── services/             # Conexión a PostgreSQL y Cloudinary
│   └── types/                # Interfaces y tipos TypeScript
```

El backend está **completamente desacoplado** del frontend. Se comunican exclusivamente vía API REST bajo el prefijo `/api/v1`. La base de datos, el almacenamiento de imágenes (Cloudinary) y la lógica de autenticación son servicios independientes.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js + TypeScript | Runtime y tipado estático estricto |
| Express 5 | Framework HTTP |
| PostgreSQL + pg | Base de datos relacional |
| JWT + bcrypt | Autenticación y hashing de contraseñas |
| Cloudinary | Almacenamiento de imágenes (API externa real) |
| Multer | Manejo de archivos multipart |
| Helmet | Cabeceras de seguridad HTTP |
| CORS | Control de acceso entre dominios |
| express-rate-limit | Limitación de peticiones |
| Zod | Validación de esquemas |

---

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
PORT=4000
DATABASE_URL=postgresql://usuario:password@host:5432/artspace
JWT_SECRET=una_clave_secreta_larga_y_segura
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## Instalación y ejecución

```bash
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

---

## Endpoints de la API

### Autenticación — `/api/v1/auth`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/registro` | Crear cuenta nueva | No |
| POST | `/login` | Iniciar sesión, devuelve JWT | No |

### Perfil de usuario — `/api/v1/usuarios`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/me` | Ver perfil propio | Sí |
| PUT | `/me` | Editar perfil y avatar | Sí |
| GET | `/:id` | Ver perfil de otro usuario | Sí |

### Obras — `/api/v1/obras`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/feed` | Obras de usuarios que sigues | Sí |
| GET | `/` | Todas las obras (filtros: categoria, subcategoria, busqueda) | Sí |
| GET | `/:id` | Detalle de obra con comentarios | Sí |
| POST | `/` | Publicar obra con imagen | Sí |
| PUT | `/:id` | Editar obra propia | Sí |
| DELETE | `/:id` | Eliminar obra propia (o admin) | Sí |

### Likes — `/api/v1/obras/:id/likes`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/` | Dar like a una obra | Sí |
| DELETE | `/` | Quitar like | Sí |

### Comentarios — `/api/v1/obras/:id/comentarios`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/` | Comentar una obra | Sí |
| POST | `/:idComentario/respuestas` | Responder un comentario | Sí |
| DELETE | `/:idComentario` | Eliminar comentario (autor o admin) | Sí |

### Seguidores — `/api/v1/usuarios`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/:id/seguir` | Seguir a un usuario | Sí |
| DELETE | `/:id/seguir` | Dejar de seguir | Sí |
| GET | `/:id/seguidores` | Ver quién sigue al usuario | Sí |
| GET | `/:id/siguiendo` | Ver a quién sigue el usuario | Sí |

### Administración — `/api/v1/admin` *(requiere rol admin)*

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios` | Listar todos los usuarios |
| PUT | `/usuarios/:id/rol` | Cambiar rol de usuario |
| DELETE | `/usuarios/:id` | Eliminar usuario |
| GET | `/obras` | Ver todas las obras |
| GET | `/comentarios` | Ver todos los comentarios |
| GET | `/categorias` | Listar categorías con subcategorías |
| POST | `/categorias` | Crear categoría |
| POST | `/categorias/subcategorias` | Crear subcategoría |
| DELETE | `/categorias/:id` | Eliminar categoría |

---

## Seguridad implementada

- **JWT** con expiración de 7 días para autenticación stateless
- **bcrypt** (salt rounds: 10) para hasheo de contraseñas
- **Helmet** para cabeceras HTTP seguras
- **CORS** configurado
- **Consultas parametrizadas** en PostgreSQL para prevenir SQL injection
- **Control de roles**: middleware `verificarToken` + `soloAdmin`
- **Validaciones de negocio**: no puedes seguirte a ti mismo, no puedes dar like dos veces, solo el autor o admin puede eliminar sus recursos
- **Multer** restringe subida a imágenes JPG, PNG, WEBP con máximo 5 MB

---

## Integración con API externa

Las imágenes de obras y avatares se suben directamente a **Cloudinary** desde el servidor usando `upload_stream`. Las URLs resultantes (HTTPS) se almacenan en la base de datos.

---

## Despliegue

| Servicio | URL |
|---|---|
| Frontend (Vercel) | [art-space-frontend-eta.vercel.app](https://art-space-frontend-eta.vercel.app/) |
| Backend (Railway) | [artspacebackend-production.up.railway.app](https://artspacebackend-production.up.railway.app/) |

El backend está desplegado en **Railway** con la base de datos PostgreSQL provisionada en el mismo servicio. El frontend está desplegado en **Vercel**.

Repositorio: [github.com/YBJ-UP/ArtSpace_backend](https://github.com/YBJ-UP/ArtSpace_backend)
