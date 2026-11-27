# SDADI Community

Base visual de la plataforma abierta de ideas, innovación y colaboración comunitaria.

## Estado actual

- Fase 1: portada, sistema visual, navegación responsive y componentes reutilizables.
- Fase 2: explorador con búsqueda, filtros, ordenamiento y detalles de propuestas.
- Fase 3: formulario real de publicación conectado a `public.proposals` y detalle dinámico desde Supabase.
- Supabase: esquema SQL, políticas RLS y configuración pública preparados.
- Auth: registro, inicio de sesión, sesión persistente y protección de publicar propuesta.
- GitHub Pages: configurado para la rama `main` y la carpeta raíz.

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador o servir la carpeta con cualquier servidor HTTP estático.

## Supabase

El esquema está en `database/schema.sql` y las políticas en `database/policies.sql`. En Supabase SQL Editor se deben ejecutar en ese orden, y después `database/grants.sql`.

Si el esquema ya estaba aplicado, ejecutar `database/migrations/001_proposals_link.sql` para añadir la columna `link_url` de las propuestas.

La configuración pública está en `config/supabase.js`. Nunca coloques una clave `service_role`, contraseña de PostgreSQL o secreto en el frontend.

## Publicación

GitHub Pages debe usar:

- Branch: `main`
- Folder: `/ (root)`

La URL prevista es `https://benjamin-gonzalez-hoxst.github.io/SDADI-Community/`.

Cloudflare no aloja este proyecto. Se evaluará más adelante únicamente como DNS/proxy y protección de bots cuando exista un dominio propio.

## Próximos pasos

1. Confirmar que GitHub Pages termine de construir el sitio.
2. Ejecutar `database/grants.sql` y `database/migrations/001_proposals_link.sql` en Supabase.
3. Probar un registro real en Supabase.
4. Conectar `proposals` a `pages/explore.html` y sustituir datos demo gradualmente.
5. Implementar votos, comentarios y perfiles.

Para el contexto completo de continuidad, leer `HANDOFF-OTRA-IA.md`.
