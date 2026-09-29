# Despliegue en Vercel

El frontend y el backend viven en repositorios Git separados y se despliegan como dos proyectos Vercel.

## Backend

1. Importa `Enzy-1/servback` como un proyecto Vercel y deja **Root Directory** en `.` (raíz del repositorio).
2. Usa la detección automática de Express; `src/index.js` exporta la aplicación para Vercel Functions.
3. Crea/conecta una base MongoDB Atlas y un Vercel Blob store **Private** al proyecto del backend. La conexión de Blob debe proporcionar `BLOB_READ_WRITE_TOKEN`; no lo pongas en el proyecto frontend.
4. Configura estas variables en Production (y Preview si se usa):

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI `mongodb+srv://` de Atlas |
| `MONGODB_DB` | Nombre de la base, por ejemplo `servtec` |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 bytes |
| `ADMIN_EMAIL` | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Contraseña inicial de al menos 12 caracteres |
| `ADMIN_NAME` | Nombre del administrador |
| `CORS_ORIGINS` | Dominio HTTPS del frontend, sin `/` final |
| `BLOB_READ_WRITE_TOKEN` | Lo añade Vercel al conectar el Blob store |

Atlas debe permitir conexiones desde Vercel. `ADMIN_PASSWORD` solo se usa si todavía no existe ese administrador en MongoDB.

## Frontend

1. Importa `Enzy-1/servfront` como otro proyecto Vercel y deja **Root Directory** en `.` (raíz del repositorio).
2. Usa el preset Vite, el comando `npm run build` y la carpeta de salida `dist`.
3. Configura las variables antes del build:

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | URL del backend más `/api`, por ejemplo `https://servback.vercel.app/api` |
| `VITE_UPLOAD_MODE` | `blob` |

El `vercel.json` del frontend incluye el fallback de React Router. Vite inserta `VITE_API_URL` durante el build, así que vuelve a desplegar el frontend si cambia el dominio del backend.

## Antes de producción

- Prueba `https://<dominio-backend>/api/health`; debe responder `{"ok":true}`.
- Registra un equipo de prueba con fotos, revisa el comprobante PDF y comprueba que las imágenes siguen disponibles después de un nuevo despliegue.
- Los datos que están en MongoDB local no se copian automáticamente a Atlas. Si necesitas conservar registros, migra la base antes de publicar.
- Las imágenes antiguas guardadas en `Servback/uploads/devices` tampoco se copian automáticamente a Blob; migra esas imágenes antes de depender de ellas en producción.
- No incluyas `.env` ni secretos en Git. Usa las variables cifradas de Vercel.
