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

Hoy el producto tiene un runtime real y completo. Lo implementado:

- `/login` con autenticacion via email y Google, cookies HTTP-only de sesion (TTL 5 dias, renovacion deslizante).
- `/app` lista los cielos reales del usuario.
- `POST /api/skies` crea cielo privado con membership `owner`.
- `/app/cielos/[skyId]` valida membresia activa server-side.
- Stars completas: crear, editar, soft-delete, drag-and-drop con coordenadas persistentes.
- Imagenes por estrella via Firebase Storage.
- Realtime de stars via Firestore onSnapshot.
- Canvas visual con SkyEngine (nebula, twinkling, estrellas atmosfericas).
- Panel de colaboradores: invitaciones con enlace unico (7 dias), miembros activos, pendientes, revocacion transaccional.

La reconstruccion ya ocurrio. El trabajo futuro es de mejora de producto (presence/cursores, onboarding, optimizaciones), no de reconstruccion de infraestructura.

### Legado que si se debe preservar

Aunque el frontend actual no sea la base funcional, si existe un legado de negocio que no se puede perder:

- Hay estrellas reales ya creadas por usuarios.
- Esas estrellas viven actualmente en Firestore.
- Al menos una parte de sus imagenes estaba almacenada en Cloudinary (migrada a Firebase Storage durante la migracion ya completada).
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

Hallazgos confirmados por auditoria real:

- `27` estrellas legacy en Firestore.
- `2` creadores unicos.
- `26` estrellas con imagen y `1` sin imagen.
- Coordenadas legacy en escala aproximada `0-100`.
- `80` assets totales en Cloudinary.
- Solo `26` assets realmente referenciados por Firestore.
- `1` asset huerfano en `stars/`: `stars/vnpubgfatrjzrepaccrz`.
- `53` assets de Cloudinary quedan fuera de la migracion automatica (`samples/**` y assets root).

### Que se conserva y que no

Se conserva:

- La data historica de estrellas.
- El valor emocional del producto.
- La idea de un cielo visual e inmersivo.
- El proyecto Firebase actual como base de continuidad operativa.

No se conserva como base obligatoria:

- La arquitectura frontend actual en Vite.
- El modelo actual implicito de "estrellas sueltas" sin entidad formal de cielo.
- La dependencia de Cloudinary fue eliminada en la migracion (ver §9).

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

### Onboarding inicial del MVP

> **[Actualizado 2026-03-14]** Los puntos sobre reclamacion de cielo y pendientes anteriores quedan superados (ver §11).

- Existe un solo entrypoint despues de login.
- Si el usuario no tiene cielos ni invitacion, el CTA principal es crear su primer cielo.
- Si el usuario entra con invitacion, acepta la invitacion primero.

### Personalizacion persistente del MVP

- La personalizacion persistente vive solo a nivel cielo.
- El MVP guarda:
  - `theme`
  - `density`
  - `nebulaEnabled`
  - `twinkleEnabled`
  - `shootingStarsEnabled`
- El MVP no persiste preferencias tecnicas del dispositivo como `quality` o `motion`.

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

Politica operativa del MVP:

- TTL de cookie: `5` dias.
- Renovacion deslizante cuando resten menos de `24` horas.
- `SameSite=Lax`.
- `Secure` en produccion.
- Revocacion de sesion en logout, password reset, remocion de miembro o evento admin sensible.

### Principios de proteccion

- Cookies HTTP-only para evitar exposicion directa desde JavaScript.
- Politica `Secure` en produccion.
- Politica `SameSite=Lax` en MVP.
- Middleware para redireccion o bloqueo de usuarios no autenticados.
- Verificacion de rol para operaciones sobre cielos compartidos.
- Reglas de Firestore y Storage alineadas con el modelo de permisos.

### Principio de permisos

- El rol de membresia y la autoria de estrella se modelan por separado.
- La autoria de estrella protege el contenido frente a otros editores, pero no reemplaza la autoridad final del `owner`.
- Todo borrado destructivo en MVP se implementa como `soft delete`.

### Matriz operativa de permisos

| Accion | `owner` | `editor` | `viewer` |
| --- | --- | --- | --- |
| Ver cielo y estrellas | Si | Si | Si |
| Crear estrella nueva | Si | Si | No |
| Editar, mover o reemplazar imagen de estrella propia | Si | Si | No |
| Soft delete de estrella propia | Si | Si | No |
| Cambiar metadata del cielo o personalizacion global | Si | No | No |
| Gestionar miembros e invitaciones | Si | No | No |

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
- `emailVerifiedAt`
- `createdAt`
- `lastLoginAt`
- `status`
- `sessionVersion`

#### `skies`

Proposito:

- Unidad principal del producto.

Campos orientativos:

- `title`
- `description`
- `ownerUserId`
- `privacy`
- `coverImagePath`
- `personalization`
- `createdAt`
- `updatedAt`

#### `skies/{skyId}/stars`

Proposito:

- Estrellas que pertenecen a un cielo concreto.

Campos orientativos:

- `title`
- `message`
- `imagePath`
- `xNormalized`
- `yNormalized`
- `year`
- `authorUserId`
- `updatedByUserId`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `deletedByUserId`

#### `skies/{skyId}/members`

Proposito:

- Relacion entre un cielo y sus usuarios con rol.

Campos orientativos:

- `userId`
- `role`
- `invitedByUserId`
- `joinedAt`
- `status`

#### `invites`

Proposito:

- Invitaciones controladas para entrar a un cielo.

Campos orientativos:

- `skyId`
- `role`
- `tokenHash`
- `createdByUserId`
- `expiresAt`
- `status`
- `acceptedByUserId`
- `acceptedAt`

### Principios del modelo

- El cielo es la entidad raiz del contenido emocional.
- La estrella no debe existir fuera de un cielo.
- Las membresias deben separarse del documento principal para permitir permisos claros.
- La autoria de estrella complementa la membresia y no la reemplaza.
- La migracion legacy fue completada. El modelo vigente no incluye campos ni entidades de legado (ver §9).

## 9. Migracion del legado

Migracion completada. Este registro documenta lo ejecutado y los resultados validados.

### Resultado de la migracion

- `27` estrellas legacy migradas al cielo `shared-legacy-v1`.
- `26` imagenes copiadas de Cloudinary a Firebase Storage (solo las referenciadas por Firestore).
- `1` estrella sin imagen migrada con `imagePath = null`.
- `1` asset huerfano (`stars/vnpubgfatrjzrepaccrz`) excluido del import automatico.
- `53` assets (`samples/**` y assets root) fuera del import automatico.
- Cero estrellas perdidas. Cero duplicados por corridas repetidas.

### Principios que rigieron la migracion

- No se escribio sobre la coleccion legacy original.
- Respaldo dual antes de cualquier transformacion (export oficial a GCS + reportes locales).
- Trazabilidad entre documento legacy y documento nuevo.
- Scripts idempotentes.

### Estado final

- La coleccion `stars` original se conserva intacta como backup.
- El cielo `shared-legacy-v1` quedo bajo ownership directa del usuario principal (ver §11, 2026-03-14).
- Cloudinary dejo de ser parte del runtime. Firebase Storage es el sistema operativo de imagenes.
- Los reportes de migracion son artefactos historicos gitignored.
- `validate:migration` falla contra el estado actual del cielo (esperado: ya tiene owner asignado).

## 10. Riesgos y decisiones abiertas

Los siguientes puntos siguen abiertos y deberan refinarse antes de entrar a implementacion completa:

- Definir si la colaboracion en tiempo real mostrara solo cambios persistidos o tambien presencia visual en vivo.
- Definir el motor grafico final del editor: evolucion del canvas actual, WebGL propio o una libreria especializada.
- Definir proveedor de correo para invitaciones y notificaciones.
- Definir si existiran enlaces de invitacion unicos por persona o invitaciones reutilizables por cielo.

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
- El onboarding inicial tendra un solo entrypoint post-login con desvio por estado.
- Limite de miembros por cielo en MVP: 5.
- Limite de imagenes por estrella en MVP: 1.
- Motor grafico MVP: Canvas 2D (SkyEngine actual). WebGL se evaluara post-MVP.
- La personalizacion persistente del MVP vive solo a nivel cielo.
- Las coordenadas legacy se preservan de forma aproximada con `xNormalized` y `yNormalized`.
- La coleccion legacy `stars` se conserva intacta como backup. Solo se elimina despues de validar la migracion.
- Este dataset se importa como un unico cielo manual `shared-legacy-v1`.
- El dato bruto legado se guarda como `legacyCreatorKeys`. (Historico — campo no presente en modelo vigente; ver 2026-03-15)
- La reclamacion de cielos legacy sera asistida por administracion y requiere email verificado. (Historico — claim legacy superado; ver 2026-03-14)
- El primer claim aprobado crea `legacy_claimant`, no `owner`. (Historico — `legacy_claimant` eliminado del runtime; ver 2026-03-14)
- La evidencia del claim se resume en `evidenceSummary`; no se persiste evidencia cruda del usuario ni quizzes derivados del legado. (Historico — evidenceSummary y quizzes descartados; ver 2026-03-14)
- El cielo debe verse muy realista (como un telescopio profesional) pero optimizado para movil. Se buscara un equilibrio calidad/rendimiento.
- Solo se migran las `26` imagenes realmente referenciadas por Firestore.
- Los assets `samples/**`, los root assets y `stars/vnpubgfatrjzrepaccrz` quedan fuera del import automatico.
- Las coordenadas legacy se preservan como porcentajes aproximados normalizados a `0..1`.
- Antes de migrar se exige backup dual: export oficial a GCS + reportes locales.
- La sesion del MVP usa cookie HTTP-only de `5` dias, renovacion deslizante de `24` horas y `SameSite=Lax`.
- Claim legacy e invitaciones requieren email verificado. (Historico — claim legacy ya no existe como frente activo; ver 2026-03-14)
- **[2026-03-14] Transicion a ownership directa del cielo legacy.** El cielo `shared-legacy-v1` queda bajo propiedad directa del usuario principal (uid `G3Sr0P2LAORmFi5yiT8cxwd7n8I2`). El flujo de claim legacy queda superado como frente activo del producto. La colaboracion con el segundo legacy creator se resuelve via invitacion estandar (editor). Los tipos y contratos de claim (`SkyClaimStatus`, `ClaimReviewStatus`, `LegacyClaimRecord`, `legacy_claimant`) se eliminaran del runtime en una fase de simplificacion posterior. El tooling de migracion se revisara en una fase de archivo separada. Las secciones de claim en este documento quedan marcadas como superadas pero se preservan como trazabilidad historica.
- **[2026-03-15] Fase 3 archivada.** Tooling legacy archivado. Dominio limpiado: `SHARED_LEGACY_IMPORT_CONFIG` removido de `src/domain/`; `DEFAULT_SKY_PERSONALIZATION` movida a `contracts.ts`; scripts marcados como `@deprecated` con semántica histórica explícita. Los bullets anteriores sobre `legacy_claimant`, `evidenceSummary` y flujo de claim son trazabilidad histórica — no representan el modelo activo.

## 12. Preguntas abiertas

- Que nivel de colaboracion en vivo se quiere mostrar en la interfaz del editor?
- Que estilo visual exacto debe tener el rediseno de marca y producto?
- Definir el motor grafico final: evolucion del Canvas 2D, WebGL con shaders ligeros, texturas pre-renderizadas, o combinacion.

## 13. Roadmap

Fases 0–7 completadas. Ver §11 para el registro histórico de decisiones.

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
