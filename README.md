# Iron Tinder

## Descripción

Construye una aplicación full-stack de citas donde los estudiantes de Ironhack puedan encontrar su "iron love". Los usuarios se registran, configuran su perfil y preferencias, navegan por perfiles sugeridos, y cuando dos usuarios se dan like mutuamente se crea un match que les permite intercambiar mensajes privados.

Este es un proyecto de **pair-programming**. Construiréis primero la **API REST completa** (iteraciones 1-4) y después el **frontend con React** (iteraciones 5-7).

## Objetivos de aprendizaje

Al completar este laboratorio seréis capaces de:

- Diseñar e implementar una API REST con Express y Mongoose
- Implementar autenticación basada en sesiones con cookies
- Definir schemas de Mongoose con validaciones, referencias y virtuals
- Construir consultas filtradas a la base de datos basadas en las preferencias del usuario
- Implementar un sistema de matching con detección de likes mutuos
- Crear un frontend en React que consuma vuestra propia API
- Gestionar el estado de autenticación con React Context
- Construir aplicaciones multipágina con React Router
- Manejar formularios, llamadas a la API y estados de carga/error en React

## Requisitos

- Node.js (v20 o superior)
- MongoDB ejecutándose localmente (`mongod`)
- Un editor de código (VS Code recomendado)
- Postman o herramienta similar para probar la API (se incluye una colección lista para importar)
- Dos miembros del equipo listos para hacer pair-programming

## Configuración inicial

```bash
# Clonar el repositorio
git clone <url-de-tu-repo>
cd iron-tinder

# Instalar dependencias de la API
cd api
npm install

# Copiar las variables de entorno y configurarlas
cp .env.example .env
# Editar .env con vuestros valores

# Iniciar el servidor en modo desarrollo
npm run dev
```

La configuración del frontend se cubre en la Iteración 5.

### Colección Postman

En la raíz del proyecto encontraréis el archivo `iron-tinder.postman_collection.json`. Importadlo en Postman para tener todas las peticiones de la API listas para probar. La colección usa la variable `{{baseUrl}}` (por defecto `http://localhost:3000/api`) y está organizada por recursos (Auth, Profile, Suggestions, etc.).

## Entrega

- Al finalizar, cread un Pull Request en vuestro repositorio
- Ambos miembros del equipo deben tener commits en el repositorio
- La API debe ser completamente funcional antes de empezar el frontend
- URL de la aplicación desplegada (si aplica)

---

## Modelos de datos

### User

| Campo | Tipo | Detalles |
|---|---|---|
| `email` | `String` | Requerido, único, lowercase, trimmed, formato email válido |
| `password` | `String` | Requerido, hasheado antes de guardar (bcrypt) |
| `name` | `String` | Requerido, trimmed |
| `age` | `Number` | Requerido, mínimo 18 |
| `gender` | `String` | Requerido, enum: `"male"`, `"female"`, `"other"` |
| `bio` | `String` | Trimmed, máximo 500 caracteres |
| `pics` | `[String]` | Array de URLs de imágenes, mínimo 1 requerida |
| `preferences.gender` | `String` | Enum: `"male"`, `"female"`, `"other"`, `"everyone"` |
| `preferences.ageMin` | `Number` | Edad mínima preferida, por defecto 18 |
| `preferences.ageMax` | `Number` | Edad máxima preferida, por defecto 99 |
| `preferences.maxDistance` | `Number` | Distancia máxima en km, por defecto 50 |
| `location` | `{ type: "Point", coordinates: [lng, lat] }` | GeoJSON Point para geolocalización |
| `likedUsers` | `[ObjectId]` | Referencias a usuarios a los que se ha dado like |
| `passedUsers` | `[ObjectId]` | Referencias a usuarios que se han descartado |
| `timestamps` | | `createdAt` y `updatedAt` automáticos |

### Match

| Campo | Tipo | Detalles |
|---|---|---|
| `users` | `[ObjectId]` | Array de exactamente 2 referencias a User |
| `matchedAt` | `Date` | Por defecto `Date.now` |
| `timestamps` | | `createdAt` y `updatedAt` automáticos |

### Message

| Campo | Tipo | Detalles |
|---|---|---|
| `sender` | `ObjectId` | Referencia a User, requerido |
| `match` | `ObjectId` | Referencia a Match, requerido |
| `content` | `String` | Requerido, trimmed |
| `timestamps` | | Solo `createdAt` (los mensajes no se pueden editar) |

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Registrar un nuevo usuario | No |
| `POST` | `/api/auth/login` | Iniciar sesión y recibir cookie de sesión | No |
| `DELETE` | `/api/auth/logout` | Cerrar sesión (eliminar sesión) | Sí |
| `GET` | `/api/auth/verify` | Verificar que la sesión actual es válida | Sí |

**POST /api/auth/signup**

Cuerpo de la petición:
```json
{
  "email": "ada@ironhack.com",
  "password": "ironhack123",
  "name": "Ada Lovelace",
  "age": 25,
  "gender": "female"
}
```

Respuesta: El objeto del usuario creado (sin password).

**POST /api/auth/login**

Cuerpo de la petición:
```json
{
  "email": "ada@ironhack.com",
  "password": "ironhack123"
}
```

Respuesta: El objeto del usuario. Se establece una cookie `sessionId` en la respuesta.

**GET /api/auth/verify**

Respuesta: El objeto del usuario autenticado. Úsalo para restaurar la sesión al recargar la página.

---

### Perfil

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/profile` | Obtener el perfil completo del usuario autenticado | Sí |
| `PATCH` | `/api/profile` | Actualizar campos del perfil (bio, pics, preferencias, ubicación) | Sí |

**PATCH /api/profile**

Cuerpo de la petición (todos los campos son opcionales):
```json
{
  "bio": "Full-stack developer in love with JavaScript",
  "pics": ["https://example.com/pic1.jpg", "https://example.com/pic2.jpg"],
  "preferences": {
    "gender": "everyone",
    "ageMin": 22,
    "ageMax": 35,
    "maxDistance": 30
  },
  "location": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]
  }
}
```

Respuesta: El objeto del usuario actualizado.

---

### Sugerencias

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/suggestions` | Obtener una lista de usuarios sugeridos según las preferencias | Sí |

**Cómo funciona el algoritmo de sugerencias:**

Devuelve usuarios que cumplan TODOS los siguientes criterios:
1. El usuario **no** es el usuario autenticado
2. El usuario **no** ha sido previamente dado like ni descartado por el usuario autenticado
3. El **género** del usuario coincide con la preferencia de género del usuario autenticado (si la preferencia es `"everyone"`, mostrar todos los géneros)
4. La **edad** del usuario está dentro del rango `ageMin` - `ageMax` del usuario autenticado
5. *(Opcional)* El usuario está dentro de `maxDistance` km (requiere geolocalización — omitir este filtro si el usuario no tiene ubicación configurada)

Respuesta: Array de objetos de usuario (sin password).

---

### Likes y Passes

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/likes/:userId` | Dar like a un usuario. Devuelve info del match si es mutuo. | Sí |
| `POST` | `/api/pass/:userId` | Descartar a un usuario. | Sí |

**POST /api/likes/:userId**

Respuesta cuando **no hay match**:
```json
{
  "liked": true,
  "match": false
}
```

Respuesta cuando **se detecta un match** (el otro usuario ya te había dado like):
```json
{
  "liked": true,
  "match": true,
  "matchId": "60f7b2c..."
}
```

**Cómo funciona la detección de match:**

Cuando el Usuario A da like al Usuario B:
1. Añadir el id del Usuario B al array `likedUsers` del Usuario A
2. Comprobar si el array `likedUsers` del Usuario B ya contiene el id del Usuario A
3. Si es así, crear un nuevo documento Match con ambos ids de usuario y devolver `match: true`

**POST /api/pass/:userId**

Respuesta:
```json
{
  "passed": true
}
```

---

### Matches

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/matches` | Obtener todos los matches del usuario autenticado | Sí |

Respuesta: Array de objetos Match con datos de usuario populados. Cada match incluye la info del perfil del "otro" usuario (nombre, fotos, bio).

---

### Mensajes

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/messages/:matchId` | Obtener todos los mensajes de un match específico | Sí |
| `POST` | `/api/messages/:matchId` | Enviar un mensaje en un match | Sí |

**POST /api/messages/:matchId**

Cuerpo de la petición:
```json
{
  "content": "Hey! Nice to match with you!"
}
```

Respuesta: El objeto del mensaje creado.

**GET /api/messages/:matchId**

Respuesta: Array de objetos de mensaje ordenados por `createdAt` ascendente, con el campo `sender` populado (al menos nombre y fotos).

**Importante:** Antes de permitir operaciones de mensajes, verificar que el usuario autenticado es participante del match.

---

## Páginas y componentes del frontend

Sois libres de diseñar la interfaz como queráis. A continuación se lista lo que es obligatorio implementar.

### Páginas

| Página | Ruta | Descripción |
|---|---|---|
| **Signup Page** | `/signup` | Formulario de registro (email, password, nombre, edad, género) |
| **Login Page** | `/login` | Formulario de login (email, password) |
| **Profile Page** | `/profile` | Ver y editar tu perfil (bio, fotos, preferencias, ubicación) |
| **Suggestions Page** | `/` | Página principal mostrando tarjetas de usuario con botones Like / Pass |
| **Matches Page** | `/matches` | Lista de todos tus matches |
| **Conversation Page** | `/matches/:matchId` | Vista de chat para un match específico |

### Componentes

- **Navbar** — Barra de navegación con enlaces a Sugerencias, Matches, Perfil y un botón de Logout
- **UserCard** — Muestra la foto, nombre, edad y bio de un usuario sugerido con botones de Like y Pass
- **MatchCard** — Muestra la foto y nombre de un match, enlaza a la conversación
- **MessageBubble** — Un mensaje individual en una conversación, con estilo diferente para enviados vs recibidos
- **PrivateRoute** — Wrapper de ruta que redirige a `/login` si no hay sesión activa

### Contexts

- **AuthContext** — Gestiona el estado de autenticación, proporciona `user`, `login`, `signup`, `logout` y `verify`

### Services

- **api-service.js** — Instancia de Axios configurada con `baseURL` y `withCredentials: true`, con funciones para cada endpoint de la API

---

## Iteraciones

---

### Iteración 1 — Auth API (Backend)

**Objetivo:** Implementar el registro de usuarios, login, gestión de sesiones y middleware de autenticación.

**Qué implementar:**

1. **User Model** (`api/models/user.model.js`)
   - Definir el schema con los campos: `email`, `password`, `name`, `age`, `gender`
   - Añadir un hook `pre("save")` que hashee el password con bcrypt cuando se modifica
   - Añadir un método de instancia `checkPassword` que compare un password en texto plano con el hash almacenado
   - Configurar `toJSON` para eliminar `_id` y `password` de las respuestas e incluir virtuals

2. **Session Model** (`api/models/session.model.js`)
   - Un modelo simple con un campo `user` (ObjectId referencia a User)
   - Habilitar `timestamps`

3. **Auth Middleware** (`api/middlewares/auth.middleware.js`)
   - Extraer el `sessionId` de la cookie en la cabecera de la petición
   - Buscar la sesión en la base de datos y popular el usuario
   - Adjuntar la sesión a `req.session`
   - Si no se encuentra una sesión válida, responder con 401
   - Omitir la autenticación para rutas públicas: `POST /api/auth/signup` y `POST /api/auth/login`

4. **Auth Routes y Controller**
   - `POST /api/auth/signup` — Validar input, crear usuario, responder con el objeto del usuario
   - `POST /api/auth/login` — Buscar usuario por email, verificar password, crear sesión, establecer cookie `sessionId` (`httpOnly: true`), responder con el usuario
   - `DELETE /api/auth/logout` — Eliminar la sesión de la base de datos, responder con 204
   - `GET /api/auth/verify` — Devolver `req.session.user` (el usuario autenticado)

5. **Configuración de la app** (`api/app.js`)
   - Configurar Express con morgan, CORS, JSON parsing, clearBody middleware, auth middleware
   - Montar las rutas bajo `/api`
   - Añadir middleware de manejo de errores

**Cómo verificar:**

Usa Postman para:
- Registrar un nuevo usuario y confirmar que la respuesta no incluye el password
- Hacer login y comprobar que se establece una cookie `sessionId`
- Llamar a `GET /api/auth/verify` con la cookie y confirmar que devuelve el usuario
- Llamar a cualquier ruta protegida sin cookie y confirmar que recibes un 401

<details>
<summary>Pistas</summary>

- Usa `req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1]` para extraer el id de sesión de la cabecera de cookies
- Recuerda usar `httpOnly: true` al establecer la cookie para que JavaScript no pueda acceder a ella (protección contra XSS)
- El middleware `clearBody` debe eliminar `_id`, `createdAt` y `updatedAt` de `req.body` para evitar que los clientes establezcan estos campos
- Usa `http-errors` para crear errores HTTP: `throw createHttpError(401, "unauthorized")`
- Express 5 maneja los errores asíncronos automáticamente, no necesitas try/catch en los route handlers

</details>

---

### Iteración 2 — Profile & Preferences API (Backend)

**Objetivo:** Permitir a los usuarios autenticados ver y actualizar su perfil, incluyendo preferencias y ubicación.

**Qué implementar:**

1. **Ampliar el User Model**
   - Añadir los campos restantes: `bio`, `pics`, `preferences` (objeto anidado con `gender`, `ageMin`, `ageMax`, `maxDistance`), `location` (GeoJSON Point), `likedUsers`, `passedUsers`
   - Añadir un índice `2dsphere` en el campo `location` si planeáis soportar filtrado por distancia

2. **Profile Routes y Controller**
   - `GET /api/profile` — Devolver el perfil completo del usuario autenticado
   - `PATCH /api/profile` — Actualizar campos del perfil desde `req.body`, guardar y devolver el usuario actualizado

**Cómo verificar:**

Usa Postman para:
- Actualizar tu perfil con bio, fotos, preferencias y ubicación
- Obtener tu perfil y confirmar que todos los campos se han guardado correctamente
- Enviar datos inválidos (ej: edad menor de 18, enum de género inválido) y confirmar que se devuelven errores de validación

<details>
<summary>Pistas</summary>

- Usa `Object.assign(req.session.user, req.body)` para fusionar los campos de actualización, luego `await req.session.user.save()` para persistir y ejecutar validaciones
- Para la ubicación GeoJSON, el schema debería verse así: `location: { type: { type: String, enum: ["Point"] }, coordinates: [Number] }`
- Crear un índice `2dsphere`: `userSchema.index({ location: "2dsphere" })`
- Recuerda eliminar campos protegidos en el middleware `clearBody` — o manejarlo en el controller

</details>

---

### Iteración 3 — Suggestions & Matching API (Backend)

**Objetivo:** Implementar el sistema de descubrimiento donde los usuarios ven perfiles sugeridos, y la lógica de like/pass/match.

**Qué implementar:**

1. **Suggestions Route y Controller**
   - `GET /api/suggestions` — Construir una consulta MongoDB que filtre usuarios según las preferencias del usuario autenticado
   - Excluir: el propio usuario autenticado, usuarios ya en `likedUsers`, usuarios ya en `passedUsers`
   - Filtrar por: preferencia de género, rango de edad
   - Devolver la lista filtrada de usuarios

2. **Like Route y Controller**
   - `POST /api/likes/:userId` — Añadir el usuario objetivo a `likedUsers`. Después comprobar si el usuario objetivo ya ha dado like al usuario autenticado (verificar su array `likedUsers`). Si es mutuo, crear un documento Match y devolver la info del match.

3. **Pass Route y Controller**
   - `POST /api/pass/:userId` — Añadir el usuario objetivo a `passedUsers`

4. **Match Model** (`api/models/match.model.js`)
   - Definir el schema con `users` (array de 2 ObjectId refs) y `matchedAt`

5. **Matches Route y Controller**
   - `GET /api/matches` — Buscar todos los matches donde el usuario autenticado esté en el array `users`. Popular los datos de usuario.

**Cómo verificar:**

Necesitaréis al menos 2-3 usuarios de prueba para verificar esto correctamente.

- Crear múltiples usuarios con diferentes géneros y edades
- Establecer preferencias en un usuario y llamar a `GET /api/suggestions` — verificar que los resultados respetan los filtros
- Dar like a un usuario desde el Usuario A, luego iniciar sesión como Usuario B y dar like al Usuario A — verificar que se crea un match
- Llamar a `GET /api/matches` y confirmar que el match aparece para ambos usuarios

<details>
<summary>Pistas</summary>

- Construir los criterios de la consulta de sugerencias paso a paso:
  ```javascript
  const criteria = {
    _id: { $ne: user.id, $nin: [...user.likedUsers, ...user.passedUsers] },
    age: { $gte: user.preferences.ageMin, $lte: user.preferences.ageMax },
  };
  if (user.preferences.gender !== "everyone") {
    criteria.gender = user.preferences.gender;
  }
  ```
- Para comprobar un like mutuo, buscar el usuario objetivo y verificar: `targetUser.likedUsers.includes(currentUser.id)`
- Usar `$addToSet` en lugar de `$push` para evitar duplicados al añadir a `likedUsers` o `passedUsers`
- Para la consulta de matches: `Match.find({ users: userId }).populate("users")`

</details>

---

### Iteración 4 — Messaging API (Backend)

**Objetivo:** Implementar mensajería privada entre usuarios que han hecho match.

**Qué implementar:**

1. **Message Model** (`api/models/message.model.js`)
   - Definir el schema con `sender` (User ref), `match` (Match ref), `content` (String)
   - Solo habilitar el timestamp `createdAt` (los mensajes son inmutables)

2. **Message Routes y Controller**
   - `POST /api/messages/:matchId` — Crear un nuevo mensaje. Verificar que el usuario autenticado es participante del match antes de permitir la operación.
   - `GET /api/messages/:matchId` — Devolver todos los mensajes del match, ordenados por `createdAt` ascendente, con el `sender` populado.

3. **Verificación de seguridad** — Antes de cualquier operación de mensajes, verificar que `req.session.user` es uno de los usuarios del match. Si no, responder con 403.

**Cómo verificar:**

- Crear un match entre dos usuarios (de la Iteración 3)
- Enviar un mensaje desde el Usuario A en el match
- Enviar un mensaje desde el Usuario B en el match
- Obtener la conversación y verificar que los mensajes aparecen en orden
- Intentar enviar un mensaje en un match del que no formas parte — confirmar que recibes 403

<details>
<summary>Pistas</summary>

- Para verificar la participación en el match:
  ```javascript
  const match = await Match.findById(req.params.matchId);
  const isParticipant = match.users.some(
    (userId) => userId.toString() === req.session.user.id
  );
  if (!isParticipant) throw createHttpError(403, "Not your match");
  ```
- Ordenar mensajes cronológicamente: `Message.find({ match: matchId }).sort({ createdAt: 1 }).populate("sender")`
- Considerar añadir un virtual en el modelo Match para acceder fácilmente a sus mensajes

</details>

---

### Iteración 5 — Auth & Profile Pages (Frontend)

**Objetivo:** Configurar la aplicación React y construir las páginas de autenticación y perfil.

**Qué implementar:**

1. **Configuración del proyecto**
   ```bash
   cd web
   npm install
   npm run dev
   ```

2. **API Service** (`src/services/api-service.js`)
   - Crear una instancia de Axios con `baseURL` apuntando a vuestra API y `withCredentials: true`
   - Añadir un interceptor de respuesta que desenvuelva `response.data`
   - Crear funciones para cada endpoint de la API (signup, login, logout, verify, getProfile, updateProfile, etc.)

3. **Auth Context** (`src/contexts/auth-context.jsx`)
   - Al montar, llamar a `verify()` para comprobar si existe una sesión activa
   - Si no hay sesión, redirigir a `/login`
   - Proporcionar `user`, `login`, `signup`, `logout` a través del contexto
   - Mientras se verifica, no renderizar nada para evitar un flash de contenido

4. **Páginas**
   - **Signup Page** — Formulario con campos de email, password, nombre, edad, género. Al enviar, llamar a signup y redirigir a `/login`
   - **Login Page** — Formulario con email y password. Al enviar, llamar a login y redirigir a `/`
   - **Profile Page** — Mostrar los datos actuales del perfil en un formulario. Permitir editar bio, fotos (URLs), preferencias y ubicación. Al enviar, llamar a updateProfile

5. **Routing** (`src/App.jsx`)
   - Configurar React Router con rutas para `/signup`, `/login`, `/profile` y `/` (sugerencias, se construye en la siguiente iteración)
   - Rutas públicas: `/signup`, `/login`
   - Rutas protegidas: todo lo demás (usar AuthContext para redirigir)

6. **Navbar** — Enlaces a inicio (`/`), matches (`/matches`), perfil (`/profile`), y un botón de logout

**Cómo verificar:**

- Registrar un nuevo usuario a través del formulario del frontend
- Hacer login y verificar que se redirige a la página principal
- Recargar la página y verificar que la sesión se restaura (no redirige a login)
- Ir a Perfil, actualizar bio y preferencias, y verificar que los cambios persisten

<details>
<summary>Pistas</summary>

- El patrón del API service:
  ```javascript
  const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    withCredentials: true,
  });
  http.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error),
  );
  ```
- Usa `react-hook-form` para manejar formularios — simplifica la validación y el estado de envío
- En el AuthContext, usa `useNavigate` y `useLocation` de React Router
- Recuerda envolver `<App />` con `<BrowserRouter>` y `<AuthContextProvider>` en `main.jsx`

</details>

---

### Iteración 6 — Discovery & Matching Pages (Frontend)

**Objetivo:** Construir la página principal de sugerencias y la lista de matches.

**Qué implementar:**

1. **Suggestions Page** (inicio `/`)
   - Obtener sugerencias de `GET /api/suggestions`
   - Mostrar un usuario a la vez como tarjeta (o mostrar todos — a vuestra elección)
   - Cada tarjeta muestra: foto principal, nombre, edad, bio
   - Dos botones: **Like** y **Pass**
   - Al dar Like, llamar a `POST /api/likes/:userId` — si se devuelve un match, mostrar una notificación o modal
   - Al dar Pass, llamar a `POST /api/pass/:userId`
   - Después de like/pass, mostrar la siguiente sugerencia
   - Manejar el caso de cuando no quedan más sugerencias

2. **Matches Page** (`/matches`)
   - Obtener matches de `GET /api/matches`
   - Mostrar cada match como una tarjeta con la foto y nombre del otro usuario
   - Cada tarjeta enlaza a la conversación: `/matches/:matchId`

**Cómo verificar:**

- Iniciar sesión y ver sugerencias en la página principal
- Dar like y pass a usuarios, verificar que no vuelven a aparecer
- Dar like a un usuario que ya te ha dado like — verificar la notificación de match
- Ir a la página de Matches y verificar que aparece el match
- Hacer clic en un match para navegar a la página de conversación (se construye en la siguiente iteración)

<details>
<summary>Pistas</summary>

- Mantener las sugerencias en el estado de React. Cuando se da like o pass a un usuario, eliminarlo del array del estado
- Para mostrar una tarjeta a la vez, mantener un `currentIndex` en el estado e incrementarlo después de cada acción
- La respuesta del match desde el endpoint de Like te dice si se creó un match — usa esto para mostrar una celebración o notificación
- En la página de matches, necesitáis averiguar qué usuario en `match.users` es el "otro" usuario (no tú). Comparar con el id del usuario autenticado del AuthContext

</details>

---

### Iteración 7 — Messaging & Polish (Frontend)

**Objetivo:** Construir la vista de conversación, conectar todo y hacer las pruebas finales.

**Qué implementar:**

1. **Conversation Page** (`/matches/:matchId`)
   - Obtener mensajes de `GET /api/messages/:matchId`
   - Mostrar mensajes en orden cronológico
   - Estilizar los mensajes de forma diferente según si el remitente es el usuario autenticado
   - Añadir un formulario de input de mensaje en la parte inferior
   - Al enviar, llamar a `POST /api/messages/:matchId` y añadir el nuevo mensaje a la lista
   - Considerar hacer polling de nuevos mensajes cada pocos segundos (un simple `setInterval` con un fetch)

2. **Pulido y pruebas**
   - Probar el flujo completo: registro, login, configurar perfil, navegar sugerencias, like/pass, match, mensaje
   - Manejar estados de carga (mostrar un spinner mientras se cargan los datos)
   - Manejar estados de error (mostrar mensajes de error cuando fallan las llamadas a la API)
   - Manejar estados vacíos (no quedan sugerencias, no hay matches todavía, no hay mensajes todavía)
   - Verificar que la app funciona con dos sesiones de navegador diferentes (o una normal + una ventana de incógnito)

**Cómo verificar:**

- Abrir dos ventanas del navegador con sesión iniciada como usuarios diferentes
- Daros like mutuamente para crear un match
- Enviar mensajes de ida y vuelta
- Verificar que los mensajes aparecen en el orden correcto
- Probar el flujo completo desde el registro hasta la mensajería

<details>
<summary>Pistas</summary>

- Para hacer polling de nuevos mensajes, puedes usar un `useEffect` con `setInterval`:
  ```javascript
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [matchId]);
  ```
- Estilizar los mensajes enviados a la derecha y los recibidos a la izquierda (como cualquier app de chat)
- Hacer scroll hasta el final de la lista de mensajes cuando lleguen nuevos mensajes
- Usar un ref en el contenedor de mensajes: `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })`

</details>

---

## Consejos para el pair-programming

- **Cambiad de driver cada 30-45 minutos.** El driver escribe código, el navigator revisa y piensa en los siguientes pasos.
- **Comunicaos constantemente.** Hablad sobre vuestras decisiones en voz alta antes de escribir código.
- **Planificad antes de codear.** Al inicio de cada iteración, discutid el enfoque antes de tocar el teclado.
- **Haced commits frecuentes.** Haced commits pequeños y significativos al final de cada sub-tarea dentro de una iteración.
- **Ambos miembros deben entender cada línea.** Si uno no entiende algo, parad y explicad.
- **Usad ramas.** Trabajad en una feature branch para cada iteración y haced merge a `main` cuando la iteración esté completa.

---

Happy coding!
