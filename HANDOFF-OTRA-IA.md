# SDADI Community — documento de traspaso

Fecha del traspaso: 27 de noviembre de 2026

Este documento resume el estado real del proyecto para que otra IA pueda continuar sin repetir trabajo ni asumir funcionalidades que todavía no están terminadas.

## Objetivo del proyecto

SDADI Community es una plataforma abierta de ideas, innovación y colaboración comunitaria.

Idea central: las ideas crecen cuando se comparten.

La web debe permitir que las personas:

- Compartan propuestas.
- Exploren ideas de otros usuarios.
- Voten y comenten.
- Encuentren colaboradores.
- Conviertan propuestas aprobadas en proyectos.

## Repositorio y estado Git

- Repositorio: `https://github.com/Benjamin-Gonzalez-Hoxst/SDADI-Community`
- Carpeta local: `C:\Users\Administrator\Documents\SDADI`
- Rama actual: `main`
- Último commit enviado: `fe2dc71 Build SDADI Community foundation and auth`
- Estado al crear este documento: rama local sincronizada con `origin/main`.

No hacer `git reset --hard` ni borrar archivos sin revisar primero los cambios existentes.

## Arquitectura decidida

- Frontend: HTML5, CSS3 y JavaScript moderno sin React, Vite, Next.js ni proceso de compilación obligatorio.
- Hosting previsto: GitHub Pages.
- Base de datos y autenticación: Supabase Cloud.
- CDN/protección futura: Cloudflare únicamente como proxy/DNS si se configura un dominio propio.
- No usar Cloudflare Workers ni Cloudflare Pages como alojamiento principal.
- No instalar un servidor permanente en la computadora.

## Diseño implementado

Sistema visual light mode con:

- Fondo: `#F8FAFC`
- Tarjetas: `#FFFFFF`
- Azul principal: `#2563EB`
- Azul suave: `#DBEAFE`
- Texto: `#17243B`
- Texto secundario: `#64748B`
- Bordes: `#E2E8F0`
- Éxito: `#16A34A`
- Advertencia: `#DC2626`
- Tipografía: Inter

La portada tiene navegación, hero, composición visual de ideas conectadas, estadísticas demo, tarjetas de propuestas, proyectos y llamado a participar.

## Fases terminadas

### Fase 1 — Fundación visual

- Estructura inicial del proyecto.
- `index.html` completo.
- Header y footer reutilizables desde `assets/js/navigation.js`.
- Responsive para desktop, tablet y móvil.
- Página `404.html`.
- Páginas base de navegación.
- Datos demo identificados como demo.

### Fase 2 — Navegación y propuestas

- `pages/explore.html` ahora tiene búsqueda por texto.
- Filtros por categoría y estado.
- Orden por recientes, más apoyadas y más comentadas.
- Tarjetas enlazadas a `pages/proposal.html?id=...`.
- Detalle dinámico de propuestas.
- Estados vacíos y mensajes de funciones pendientes.
- Se probaron búsqueda de “huertos” y apertura del detalle localmente.

### Base de Supabase

El usuario creó un proyecto de Supabase Cloud y ejecutó manualmente en SQL Editor, en este orden:

1. `database/schema.sql`
2. `database/policies.sql`

El esquema contiene:

- `profiles`
- `proposals`
- `votes`
- `comments`
- `projects`
- `project_members`
- `community_posts`
- `reports`

También contiene relaciones, índices, restricciones, triggers de `updated_at` y un trigger que crea automáticamente el perfil al registrarse un usuario.

Las políticas RLS limitan creación, edición y eliminación a usuarios autorizados. Los reportes no se exponen para lectura desde el navegador.

## Supabase y seguridad

La configuración pública está en:

- `config/supabase.js`
- `config/supabase.example.js`
- `assets/js/supabase.js`

`config/supabase.js` contiene la URL del proyecto y una clave `sb_publishable`. Esa clave está diseñada para aparecer en el frontend, pero las políticas RLS son obligatorias.

Nunca añadir al repositorio:

- `service_role`
- claves secretas.
- contraseña de PostgreSQL.
- tokens privados.

No pedir al usuario su contraseña de Supabase o de GitHub por el chat.

## Autenticación implementada

Archivos:

- `assets/js/auth.js`
- `pages/login.html`
- `pages/register.html`
- `pages/submit.html`

Actualmente incluye:

- Registro con nombre visible, nombre de usuario, correo y contraseña.
- Inicio de sesión con correo y contraseña.
- Sesión persistente en el navegador mediante Supabase Auth.
- Mensaje para confirmar el correo.
- Protección de “Publicar propuesta”: sin sesión muestra acceso necesario.
- Con sesión detectada muestra que el formulario está listo para conectar.

La implementación usa `signUp()` y `signInWithPassword()` de `supabase-js` cargado desde CDN.

Todavía NO se ha probado creando una cuenta real, para no crear una cuenta de prueba sin autorización del usuario.

## Configuración de Supabase Auth ya realizada por el usuario

El usuario configuró el Site URL y las Redirect URLs con la dirección prevista de GitHub Pages.

Dirección correcta del sitio de proyecto:

`https://benjamin-gonzalez-hoxst.github.io/SDADI-Community/`

No usar como URL del proyecto:

`https://benjamin-gonzalez-hoxst.github.io/`

Si se prueba en local, pueden añadirse URLs locales como `http://localhost:4173/` y `http://127.0.0.1:4173/`.

## GitHub Pages

El repositorio ya fue configurado para publicar desde:

- Rama: `main`
- Carpeta: `/ (root)`

En el último estado observado GitHub indicaba que la página estaba siendo construida y el dominio raíz devolvía 404. Hay que comprobar la URL de proyecto con `/SDADI-Community/` y revisar Actions si sigue sin aparecer después de unos minutos.

## Cloudflare

Se aclaró que el objetivo NO es alojar SDADI en Cloudflare.

No desplegar el repositorio como Worker.

Cloudflare solo se usará más adelante para protección de bots, DNS, proxy y DDoS cuando exista un dominio propio. Para ello se deberá:

1. Configurar el dominio personalizado en GitHub Pages.
2. Añadir el dominio a Cloudflare.
3. Crear los registros DNS correctos hacia GitHub Pages.
4. Activar el proxy de Cloudflare cuando el dominio y HTTPS estén verificados.

Los archivos temporales `wrangler.jsonc` y `.assetsignore` fueron eliminados porque no corresponden al objetivo actual.

## Archivos principales

```text
index.html
404.html
README.md
HANDOFF-OTRA-IA.md

assets/css/global.css
assets/css/layout.css
assets/css/components.css
assets/css/responsive.css

assets/js/app.js
assets/js/auth.js
assets/js/navigation.js
assets/js/notifications.js
assets/js/supabase.js

config/supabase.js
config/supabase.example.js

database/schema.sql
database/policies.sql

pages/about.html
pages/community.html
pages/explore.html
pages/login.html
pages/profile.html
pages/projects.html
pages/proposal.html
pages/register.html
pages/settings.html
pages/submit.html
```

## Verificaciones realizadas

- Enlaces internos: 0 rotos.
- Sintaxis JavaScript: válida.
- Portada local: comprobada.
- Explorador local: comprobado.
- Búsqueda de propuestas: comprobada.
- Detalle de propuesta: comprobado.
- Formulario de registro: cargado correctamente.
- Git push: confirmado en `origin/main`.

## Pendientes prioritarios

1. Confirmar que GitHub Pages publique correctamente en `/SDADI-Community/`.
2. Probar un registro real con autorización del usuario.
3. Confirmar en Supabase que se crea la fila correspondiente en `profiles`.
4. Implementar el formulario real de publicación en `pages/submit.html`.
5. Conectar `proposals` a `pages/explore.html` y sustituir datos demo gradualmente.
6. Implementar votos con la restricción única `(proposal_id, user_id)`.
7. Implementar comentarios y respuestas.
8. Implementar perfiles y cierre de sesión.
9. Añadir manejo de errores de red y estados de carga.
10. Revisar accesibilidad, seguridad y rutas de GitHub Pages.

## Prompt listo para la siguiente IA

```text
Continúa el proyecto SDADI Community desde C:\Users\Administrator\Documents\SDADI.

Lee primero HANDOFF-OTRA-IA.md, README.md, database/schema.sql y database/policies.sql.
No repitas la Fase 1 ni la Fase 2. No reemplaces archivos sin revisarlos.

Estado actual:
- GitHub: https://github.com/Benjamin-Gonzalez-Hoxst/SDADI-Community
- Rama main ya subida con commit fe2dc71.
- GitHub Pages debe publicar desde main y /(root).
- Supabase Cloud ya fue creado.
- schema.sql y policies.sql ya fueron ejecutados manualmente en Supabase.
- Supabase Auth está integrado en login.html y register.html.
- config/supabase.js contiene la URL y clave publishable del proyecto.
- Nunca uses ni solicites una clave service_role o una contraseña.
- Cloudflare no debe alojar el sitio; solo se evaluará como proxy/DNS cuando exista un dominio propio.

Primero verifica:
1. Que GitHub Pages funcione en https://benjamin-gonzalez-hoxst.github.io/SDADI-Community/.
2. Que las rutas relativas funcionen en ese subdirectorio.
3. Que el formulario de registro cargue Supabase Auth sin errores de consola.

Después implementa la siguiente tarea pendiente: convertir pages/submit.html en un formulario real conectado a public.proposals.

Requisitos del formulario:
- Solo usuarios autenticados.
- Campos: título, descripción, problema, solución, categoría, etiquetas y enlace opcional.
- Validación en HTML y JavaScript.
- Insertar author_id usando el usuario de Supabase, nunca un ID escrito por el cliente.
- Mensajes de carga, error y éxito.
- Redirigir al detalle creado usando proposal.html?id=...
- No mostrar datos ficticios como reales.
- Mantener GitHub Pages compatible.
- Verificar enlaces, sintaxis y comportamiento antes de terminar.

Al finalizar, informa exactamente qué archivos cambiaste, qué probaste y qué quedó pendiente.
```

