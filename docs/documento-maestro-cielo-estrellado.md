# Documento Maestro: Cielo Estrellado

Estado: borrador vivo  
Uso: documento base para tomar decisiones de producto, arquitectura, migracion y roadmap

## 1. Proposito del documento

Este documento sera la referencia principal para reconstruir Cielo Estrellado como una aplicacion web moderna, colaborativa y segura, sin perder las estrellas ya creadas. Su objetivo no es cerrar cada detalle tecnico desde el dia uno, sino fijar las decisiones estructurales correctas para que el roadmap posterior salga de aqui y no de supuestos dispersos.

Este documento debe permitir:

- Definir con claridad que parte del sistema actual se conserva y que parte se reemplaza.
- Alinear producto, diseno y arquitectura antes de iniciar cambios grandes.
- Bajar despues a roadmap, backlog, modelo de datos definitivo y tareas de implementacion.

## 2. Vision del producto

Cielo Estrellado debe evolucionar de un experimento visual a una plataforma emocional y colaborativa donde una persona pueda crear un cielo con significado, guardar recuerdos, asociar imagenes y mensajes a estrellas, y compartir ese espacio con alguien importante.

La aplicacion debe transmitir tres cosas al mismo tiempo:

- Intimidad: cada cielo debe sentirse personal, privado y significativo.
- Belleza: la experiencia visual debe ser memorable, cuidada y fluida.
- Confianza: las cuentas, sesiones, permisos y archivos deben estar bien protegidos.

La meta no es solo "mostrar estrellas". La meta es ofrecer un lugar digital que combine narrativa, estetica y colaboracion, con una base tecnica solida para crecer sin rehacer todo otra vez.

## 3. Estado actual y legado

### Estado actual del repositorio

Hoy el repositorio ya no esta en Vite como base activa. El estado actual es:

- Next.js 15 con App Router
- React 19
- TypeScript
- Ruta `/demo` funcional como baseline visual
- `SkyEngine.ts` preservado como motor visual actual
- Scripts de auditoria para Firestore y Cloudinary
- Contrato de entorno con `.env.example` y `.env.local`
- Tooling base con `build`, `lint` y `typecheck`

Lo actual sigue siendo una base de producto temprana, no el producto completo. En este estado:

- No existe autenticacion implementada.
- No existe backend de sesiones.
- No existe modelo de usuarios, cielos, roles o permisos.
- No existe flujo de invitaciones.
- No existe integracion runtime visible con Firestore, Storage o Cloudinary.

Si existe trabajo ya implementado que sirve como base real:

- La migracion visual a Next.js.
- El baseline visual en `/demo`.
- La conservacion del motor de cielo actual.
- Los scripts de auditoria para inspeccionar el legado antes de migrar datos.

Conclusion: la reconstruccion no debe tratarse como una simple refactorizacion incremental del frontend actual. Debe tratarse como una nueva aplicacion que reaprovecha ideas visuales, pero redefine la arquitectura del producto.

### Legado que si se debe preservar

Aunque el frontend actual no sea la base funcional, si existe un legado de negocio que no se puede perder:

- Hay estrellas reales ya creadas por usuarios.
- Esas estrellas viven actualmente en Firestore.
- Al menos una parte de sus imagenes esta almacenada en Cloudinary.
- Cada estrella ya tiene informacion util como autor, fecha, contenido y posicion.

Ejemplo de campos observados en el legado:

- `createdAt`
- `createdBy`
- `image`
- `message`
- `title`
- `x`
- `y`
- `year`

### Que se conserva y que no

Se conserva:

- La data historica de estrellas.
- El valor emocional del producto.
- La idea de un cielo visual e inmersivo.
- El proyecto Firebase actual como base de continuidad operativa.

No se conserva como base obligatoria:

- La arquitectura frontend actual en Vite.
- El modelo actual implicito de "estrellas sueltas" sin entidad formal de cielo.
- La dependencia futura de Cloudinary.

## 4. Objetivo del relanzamiento

El relanzamiento debe convertir Cielo Estrellado en una aplicacion web seria, con estructura de producto y seguridad suficientes para crecer.

La nueva app debe incluir:

- Cuentas de usuario.
- Login con buena seguridad de sesion.
- Persistencia clara por usuario y por cielo.
- Cielos privados por defecto.
- Invitaciones para colaborar.
- Colaboracion en tiempo real.
- Gestion ordenada de imagenes y archivos.
- Un rediseno visual completo del producto.

No es objetivo del primer lanzamiento:

- Crear una red social publica con feed o descubrimiento abierto.
- Anadir monetizacion o suscripciones.
- Crear una app nativa movil.
- Resolver desde el inicio todas las variantes sociales posibles.

## 5. MVP v1

La primera version funcional seria del producto debe enfocarse en el caso de uso principal: una persona crea su cielo, lo personaliza, y puede invitar a otra persona para construirlo o editarlo con ella.

### Alcance funcional del MVP

- Registro e inicio de sesion.
- Recuperacion basica de acceso.
- Verificacion de correo para cuentas por email.
- Inicio con Google.
- Dashboard con lista de cielos del usuario.
- Creacion de un cielo nuevo.
- Editor de cielo con creacion y edicion de estrellas.
- Subida de imagenes al ecosistema de Firebase.
- Invitacion a otra persona por enlace o flujo controlado.
- Colaboracion en tiempo real dentro de un mismo cielo.
- Gestion minima de miembros y permisos.

### Fuera del MVP

- Perfiles publicos completos.
- Busqueda publica de cielos.
- Comentarios abiertos o reacciones sociales.
- Moderacion compleja.
- Historial visual avanzado o versionado tipo documento.

### Experiencia objetivo del MVP

- El usuario entiende rapido como crear su primer cielo.
- El login se siente confiable y no invasivo.
- El editor responde con fluidez en desktop y movil.
- Compartir un cielo es simple.
- La privacidad esta clara desde el inicio.

## 6. Arquitectura base propuesta

### Decision principal

La base recomendada para la nueva app es:

- Next.js
- Firebase Auth
- Firebase Admin
- Firestore
- Firebase Storage
- Firebase Realtime Database

### Razon de esta eleccion

Esta base resuelve mejor que una SPA pura tres necesidades centrales del proyecto:

- Sesiones seguras con cookies HTTP-only y control del lado servidor.
- Endpoints protegidos para invitaciones, administracion y migracion.
- Una estructura mas sana para combinar landing publica, app privada y logica sensible.

### Papel de cada pieza

#### Next.js

- Sera el contenedor principal de la nueva aplicacion.
- Permitira rutas publicas y privadas en un mismo proyecto.
- Permitira middleware y logica server-side para proteger accesos.
- No impide usar render pesado en cliente.

#### Firebase Auth + Firebase Admin

- Auth gestionara identidad de usuarios.
- Admin emitira y validara cookies de sesion seguras.
- Permitira cerrar la brecha entre login en cliente y proteccion real del lado servidor.

#### Firestore

- Guardara entidades persistentes del producto.
- Sera la fuente principal de cielos, estrellas, membresias e invitaciones.

#### Firebase Storage

- Sera el destino oficial para imagenes nuevas y migradas.
- Eliminara la dependencia futura de Cloudinary.

#### Realtime Database

- Manejara presencia, cursores, bloqueos suaves o estados efimeros de colaboracion.
- Evitara mezclar presencia en vivo con datos persistentes si eso complica Firestore.

### Render visual

La parte visual pesada del cielo debe aislarse como componente cliente. La arquitectura general no debe forzar al render 3D o WebGL a ejecutarse en servidor.

Principio de trabajo:

- El shell de la app vive en Next.js.
- El render del cielo vive en cliente.
- El motor visual debe poder evolucionar desde el demo actual hacia WebGL sin bloquear el resto del producto.

## 7. Seguridad y sesiones

La seguridad no debe quedar como un detalle posterior. Debe formar parte del diseno base.

### Objetivos de seguridad

- Evitar sesiones fragiles expuestas en frontend.
- Proteger rutas privadas desde servidor.
- Restringir acceso a cielos e imagenes segun membresia.
- Permitir revocacion real de sesiones.
- Reducir superficie de abuso en endpoints sensibles.

### Modelo propuesto de autenticacion

- Registro con email y contrasena.
- Login con email y contrasena.
- Login con Google.
- Verificacion de correo para cuentas por email.

### Modelo propuesto de sesion

Flujo esperado:

1. El usuario se autentica con Firebase Auth en cliente.
2. El cliente obtiene un ID token temporal.
3. Ese token se envia a un endpoint del servidor.
4. El servidor valida el token con Firebase Admin.
5. El servidor emite una cookie de sesion HTTP-only.
6. Las rutas privadas se protegen usando esa cookie.

### Principios de proteccion

- Cookies HTTP-only para evitar exposicion directa desde JavaScript.
- Politica `Secure` en produccion.
- Politica `SameSite` acorde al flujo final elegido.
- Middleware para redireccion o bloqueo de usuarios no autenticados.
- Verificacion de rol para operaciones sobre cielos compartidos.
- Reglas de Firestore y Storage alineadas con el modelo de permisos.

### Roles iniciales

- `owner`: crea y administra el cielo.
- `editor`: puede editar contenido compartido.
- `viewer`: puede ver pero no editar.

### Capas adicionales recomendadas

- App Check para reducir abuso automatizado.
- Auditoria de acciones criticas.
- Revocacion de sesiones en logout o eventos sensibles.

## 8. Modelo de datos inicial

El producto nuevo necesita pasar del concepto de estrellas aisladas al concepto de cielos como entidad principal.

### Entidades principales

#### `users`

Proposito:

- Perfil base del usuario autenticado.

Campos orientativos:

- `displayName`
- `email`
- `photoURL`
- `providers`
- `createdAt`
- `lastLoginAt`
- `status`

#### `skies`

Proposito:

- Unidad principal del producto.

Campos orientativos:

- `title`
- `description`
- `ownerUserId`
- `privacy`
- `coverImage`
- `createdAt`
- `updatedAt`
- `importSource`
- `claimStatus`

#### `skies/{skyId}/stars`

Proposito:

- Estrellas que pertenecen a un cielo concreto.

Campos orientativos:

- `title`
- `message`
- `imagePath`
- `legacyUrl`
- `x`
- `y`
- `year`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`
- `legacyDocId`

#### `skies/{skyId}/members`

Proposito:

- Relacion entre un cielo y sus usuarios con rol.

Campos orientativos:

- `userId`
- `role`
- `invitedBy`
- `joinedAt`
- `status`

#### `invites`

Proposito:

- Invitaciones controladas para entrar a un cielo.

Campos orientativos:

- `skyId`
- `role`
- `tokenHash`
- `createdBy`
- `expiresAt`
- `status`
- `acceptedBy`

#### `legacyCreators`

Proposito:

- Mapear creadores del sistema legado a futuros procesos de reclamacion o revision.

Campos orientativos:

- `legacyOwnerKey`
- `importedSkyId`
- `claimStatus`
- `claimedBy`
- `notes`

### Principios del modelo

- El cielo es la entidad raiz del contenido emocional.
- La estrella no debe existir fuera de un cielo.
- Las membresias deben separarse del documento principal para permitir permisos claros.
- La migracion legacy debe quedar trazable.

## 9. Migracion del legado

La migracion debe ser segura, trazable e idempotente. El objetivo no es mover datos "como sea", sino conservarlos sin bloquear el rediseno.

### Principios de migracion

- No escribir sobre la coleccion legacy original como primer paso.
- Exportar respaldo antes de cualquier transformacion.
- Migrar por fases.
- Registrar trazabilidad entre documento legacy y documento nuevo.
- Permitir repetir scripts sin duplicar contenido.

### Estrategia inicial

1. Auditar la coleccion legacy `stars`.
2. Extraer conteos por `createdBy`, cantidad de imagenes y posibles inconsistencias.
3. Crear un cielo importado por cada `createdBy`.
4. Copiar cada estrella al nuevo esquema bajo su cielo importado.
5. Migrar imagenes desde Cloudinary a Firebase Storage.
6. Guardar referencias de origen (`legacyDocId`, `legacyUrl`, estado de migracion).
7. Marcar esos cielos como `unclaimed` hasta que exista una cuenta nueva que deba reclamarlos.

### Reclamacion de contenido legado

Dado que hoy no esta confirmado que existan cuentas reutilizables asociadas a `createdBy`, el contenido legado no debe asumirse como ya vinculado a una identidad nueva.

Decision inicial:

- La reclamacion de cielos legacy sera asistida por administracion en una primera etapa.

Esto evita:

- Asignaciones erroneas.
- Suposiciones debiles sobre identidades antiguas.
- Perdida de trazabilidad durante el relanzamiento.

### Migracion de imagenes

Objetivo:

- Cloudinary deja de ser el sistema principal.

Plan estructural:

- Las imagenes nuevas se suben solo a Firebase Storage.
- Las imagenes legacy se copian a Storage.
- Durante la migracion se conserva la URL anterior como referencia.
- Cuando el sistema nuevo este estable, Cloudinary puede quedar solo como respaldo temporal o eliminarse.

## 10. Riesgos y decisiones abiertas

Los siguientes puntos siguen abiertos y deberan refinarse antes de entrar a implementacion completa:

- Confirmar volumen real de estrellas y peso de imagenes a migrar.
- Confirmar limites, costos y velocidad practica de copiar desde Cloudinary a Storage.
- Definir si la colaboracion en tiempo real mostrara solo cambios persistidos o tambien presencia visual en vivo.
- Definir el motor grafico final del editor: evolucion del canvas actual, WebGL propio o una libreria especializada.
- Definir proveedor de correo para invitaciones y notificaciones.
- Definir si existiran enlaces de invitacion unicos por persona o invitaciones reutilizables por cielo.
- Definir politica final de recuperacion o reclamacion de contenido legacy.

## 11. Decisiones tomadas

- El documento inicial sera uno solo y actuara como base de decisiones.
- Estara orientado a producto mas arquitectura, no a presentacion comercial.
- El roadmap se derivara de este documento y no sera el punto de partida.
- Se reutilizara el proyecto Firebase actual con esquema nuevo.
- La migracion sera por fases.
- El sistema nuevo tendra cielos como entidad principal.
- El MVP sera privado por defecto.
- El login inicial sera por email y Google.
- La base tecnica recomendada es Next.js + ecosistema Firebase.
- Limite de miembros por cielo en MVP: 5.
- Limite de imagenes por estrella en MVP: 1.
- Motor grafico MVP: Canvas 2D (SkyEngine actual). WebGL se evaluara post-MVP.
- Las coordenadas de estrellas legacy no necesitan migrarse exactamente. Solo se migra contenido emocional (titulo, mensaje, imagen, autor, fecha, ano). Las posiciones se asignaran cuando el motor visual este definido.
- La coleccion legacy `stars` se conserva intacta como backup. Solo se elimina despues de validar la migracion.
- La reclamacion de cielos legacy sera asistida por administracion.
- El cielo debe verse muy realista (como un telescopio profesional) pero optimizado para movil. Se buscara un equilibrio calidad/rendimiento.

## 12. Preguntas abiertas

- Como se validara operativamente que una persona reclama un cielo legado correcto?
- Que nivel de colaboracion en vivo se quiere mostrar en la interfaz del editor?
- Que estilo visual exacto debe tener el rediseno de marca y producto?
- Definir el motor grafico final: evolucion del Canvas 2D, WebGL con shaders ligeros, texturas pre-renderizadas, o combinacion.

## 13. Roadmap refinado

El roadmap esta organizado en 8 fases con dependencias claras. Cada fase tiene tareas concretas y entregables verificables. El detalle completo de cada tarea esta en el plan de implementacion.

### Fase 0 - Auditoria y preparacion

- Exportar respaldo completo de Firestore a GCS.
- Script de auditoria sobre coleccion legacy `stars` (conteos, campos, coordenadas, fechas).
- Inventariar imagenes en Cloudinary via API.
- Documentar costos y limites de Firebase y Cloudinary.
- Cerrar decisiones bloqueantes (completado: ver seccion 11).

### Fase 1 - Scaffolding Next.js + motor visual

- Consolidar el proyecto Next.js actual (App Router + TypeScript) como base del producto.
- Migrar SkyEngine.ts sin cambios como modulo client-side.
- Crear wrapper SkyCanvas con `"use client"` + dynamic import `ssr: false`.
- Crear ruta `/demo` que reproduzca el cielo identico al demo actual.
- Configurar ESLint CLI no interactivo.
- Dejar App Hosting y cualquier decision de despliegue SSR para la fase de lanzamiento.

### Fase 2 - Autenticacion y sesiones seguras

- Configurar Firebase Auth SDK (client) y Firebase Admin SDK (server).
- Implementar flujo de sesion con cookies HTTP-only (idToken -> createSessionCookie -> Set-Cookie).
- Middleware Next.js para proteger rutas privadas.
- Paginas de auth: login, registro, recuperacion de contrasena.
- Crear coleccion `users/{uid}` al registrarse.
- Logout con revocacion de sesion.
- Verificacion de email.

### Fase 3 - Modelo de datos y CRUD de cielos

- Crear colecciones: skies, stars (sub), members (sub), invites.
- Definir tipos TypeScript del modelo completo.
- Dashboard con lista de cielos del usuario.
- Creacion de cielo nuevo con membresia automatica.
- Editor de cielo con SkyCanvas como fondo + capa overlay para estrellas de usuario.
- Visualizacion de estrella (modal con contenido).
- Reglas de seguridad de Firestore desplegadas.

### Fase 4 - Imagenes, invitaciones y colaboracion

Paralelizable internamente: imagenes (4.A) e invitaciones (4.B) pueden desarrollarse en paralelo.

#### 4.A - Imagenes (Firebase Storage)
- Configurar Storage con reglas de seguridad (5MB max, solo imagenes, solo owner/editor).
- Componente de upload con preview, compresion client-side y progreso.
- Servir imagenes con getDownloadURL.

#### 4.B - Invitaciones
- Generar enlace con token unico y expiracion (7 dias).
- Pagina de aceptacion de invitacion.
- Panel de gestion de miembros (roles y revocacion).

#### 4.C - Presencia y tiempo real
- Firebase Realtime Database para presencia online con onDisconnect.
- Indicador de colaboradores activos en el editor.
- Sincronizacion de estrellas con onSnapshot de Firestore.

### Fase 5 - Migracion del legado

- Script de migracion de estrellas: agrupar por createdBy, crear cielo por creador, migrar contenido (sin posiciones). Idempotente.
- Script de migracion de imagenes: Cloudinary -> Firebase Storage. Reanudable.
- Crear coleccion legacyCreators con mapeo.
- Script de validacion post-migracion.
- Interfaz admin para reclamacion de cielos legacy.

### Fase 6 - Pulido visual, UX y landing

Paralelizable con Fase 5.

- Landing page con SkyCanvas inmersivo.
- Rediseno de dashboard y editor.
- Responsive completo (desktop + movil).
- Accesibilidad WCAG AA.
- Optimizacion de rendimiento (lazy loading, next/image, bundle size).

### Fase 7 - Estabilizacion y lanzamiento

- Auditoria de seguridad completa (reglas, endpoints, cookies, roles, App Check).
- Testing integral en multiples navegadores y dispositivos.
- Migracion final en produccion + validacion.
- Monitoreo basico (Performance Monitoring, alertas).
- Ejecutar deploy final en la plataforma elegida para produccion.
- Documentacion actualizada.

### Grafo de dependencias

```
Fase 0 (Auditoria)
  |
  v
Fase 1 (Next.js + Motor visual)
  |
  v
Fase 2 (Auth + Sesiones)
  |
  v
Fase 3 (Modelo datos + CRUD)
  |
  +---> Fase 4.A (Imagenes)  ---+
  |                              |
  +---> Fase 4.B (Invitaciones) +---> Fase 4.C (Tiempo real)
  |                              |
  +---> Fase 5 (Migracion) -----+  (requiere 3 + 4.A)
  |                              |
  +---> Fase 6 (Visual/UX) -----+  (requiere 4, paralelizable con 5)
                                 |
                                 v
                           Fase 7 (Lanzamiento)
```

## 14. Como se seguira puliendo este documento

Orden recomendado de refinamiento:

1. Vision del producto.
2. Estado actual y legado.
3. MVP v1.
4. Arquitectura base.
5. Seguridad y sesiones.
6. Modelo de datos.
7. Migracion.
8. Roadmap refinado.

Regla de trabajo:

- Toda decision importante debe reflejarse primero aqui.
- Si una decision cambia, se actualizan tambien `Decisiones tomadas` y `Preguntas abiertas`.
- El backlog tecnico futuro debe derivarse de este documento y no reemplazarlo.
