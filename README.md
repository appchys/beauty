# BeautyPoints - Sistema de Fidelidad para Centros Estéticos

Un sistema moderno de tarjetas de fidelidad que utiliza códigos QR **únicos por cliente** para conectar centros estéticos con sus clientes de manera simple y efectiva.

🚀 **Nuevas funcionalidades implementadas:**
- ✅ **QR Codes únicos por cliente** - Cada código QR se asigna a un cliente específico
- ✅ **Portal del cliente completo** - Dashboard personal con progreso detallado
- ✅ **Registro automático** - Los clientes se registran automáticamente al escanear

## 🌟 Características

- **Para Administradores:**
  - Panel de administración completo
  - Generación de códigos QR únicos y personalizados
  - Asignación de QR codes a clientes específicos (opcional)
  - Códigos QR con fecha de expiración (30 días)
  - Estadísticas de escaneos y clientes
  - Configuración de puntos y promociones

- **Para Clientes:**
  - **Portal del cliente personalizado** con:
    - Dashboard visual con progreso de todas las tarjetas
    - Estadísticas personales (tarjetas completadas, activas, total stickers)
    - Vista detallada de cada tarjeta con progreso visual
    - Historial de recompensas obtenidas
  - Escaneo simple con la cámara del móvil
  - Acumulación automática de puntos
  - No requiere descarga de apps
  - Registro automático al primer escaneo
  - **QR codes únicos** - No se pueden reutilizar entre clientes

## 🔐 Seguridad y Uniqueness de QR Codes

### Sistema de QR Únicos:
1. **Generación única**: Cada QR code tiene un UUID único
2. **Asignación por cliente**: Los QR se pueden pre-asignar a emails específicos
3. **Uso único**: Una vez escaneado, el QR queda marcado como usado
4. **Expiración**: Los QR codes expiran automáticamente en 30 días
5. **Validación robusta**: Verificación en backend antes de otorgar puntos

### Flujo de QR Únicos:
```
Admin crea QR → Opcional: asigna a cliente específico → Cliente escanea → 
Si no hay cliente asignado: registro automático → Asignación del QR → 
Validación de uso único → Otorgar sticker → Marcar QR como usado
```

## 🚀 Tecnologías

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** Firebase Firestore (NoSQL)
- **Autenticación:** NextAuth.js con Firebase Admin SDK
- **QR Codes:** qrcode + @zxing/library
- **UI:** Lucide React icons
- **Deployment:** Vercel con CI/CD automático

## 📦 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [tu-repo]
   cd beauty
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   - Copia `.env.example` a `.env`
   - Configura las credenciales de Firebase
   - Actualiza las variables de NextAuth

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 🔧 Configuración

### Variables de Entorno

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="tu_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu_proyecto_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu_proyecto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu_app_id"

# Firebase Admin Configuration
FIREBASE_PROJECT_ID="tu_proyecto_id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu_proyecto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----"

# NextAuth Configuration
NEXTAUTH_SECRET="tu-secreto-super-seguro"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Base de Datos

El proyecto usa Firebase Firestore, una base de datos NoSQL en tiempo real. No requiere configuración adicional una vez configuradas las credenciales.

## 📖 Uso

### Como Administrador

1. **Registro:** Ve a `/auth/register` y selecciona "Administrador"
2. **Login:** Inicia sesión en `/auth/signin`
3. **Crear QR:** En el panel de admin, crea códigos QR con los puntos deseados
4. **Compartir:** Comparte los códigos QR impresos o digitalmente

### Como Cliente

1. **Escanear:** Usa la cámara del móvil para escanear el código QR
2. **Registrarse:** Completa tus datos en el primer escaneo
3. **Acumular:** Los puntos se agregan automáticamente a tu cuenta

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar en producción
npm run lint         # Verificar código
```

## 📁 Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
│   ├── admin/          # Panel de administración
│   ├── auth/           # Páginas de autenticación
│   ├── client/         # Dashboard de cliente
│   ├── scan/           # Páginas de escaneo QR
│   └── api/            # API Routes
├── components/         # Componentes reutilizables
├── lib/               # Utilidades y configuración
│   ├── firebase.ts    # Configuración Firebase Client
│   ├── firebase-admin.ts # Configuración Firebase Admin
│   ├── firestore-admin.ts # Funciones de base de datos
│   └── auth-config.ts # Configuración NextAuth
└── types/             # Tipos de TypeScript
```

## 🔐 Seguridad

- Autenticación con NextAuth.js
- Validación de datos en frontend y backend
- Sanitización de inputs
- Manejo seguro de contraseñas con bcrypt

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno de Firebase
3. Despliega automáticamente

**🌐 Aplicación en vivo:** [https://beauty-pearl.vercel.app/](https://beauty-pearl.vercel.app/)

### Otros Proveedores

El proyecto es compatible con cualquier plataforma que soporte Node.js.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda, no dudes en crear un issue en el repositorio.

---

Desarrollado con ❤️ para centros estéticos modernos.
