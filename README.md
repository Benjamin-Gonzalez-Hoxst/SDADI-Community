# SDADI Community

Base visual de la plataforma abierta de ideas, innovación y colaboración comunitaria.

## Estado actual

- Fase 1: portada, sistema visual, navegación responsive y componentes reutilizables.
- Fase 2: explorador con búsqueda, filtros, ordenamiento y detalles de propuestas.
- Supabase: esquema SQL, políticas RLS y configuración pública preparados.
- Auth: registro, inicio de sesión, sesión persistente y protección de publicar propuesta.
- GitHub Pages: configurado para la rama `main` y la carpeta raíz.

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador o servir la carpeta con cualquier servidor HTTP estático.

## Supabase

El esquema está en `database/schema.sql` y las políticas en `database/policies.sql`. En Supabase SQL Editor se deben ejecutar en ese orden.

La configuración pública está en `config/supabase.js`. Nunca coloques una clave `service_role`, contraseña de PostgreSQL o secreto en el frontend.

## Publicación

GitHub Pages debe usar:

- Branch: `main`
- Folder: `/ (root)`

La URL prevista es `https://benjamin-gonzalez-hoxst.github.io/SDADI-Community/`.

Cloudflare no aloja este proyecto. Se evaluará más adelante únicamente como DNS/proxy y protección de bots cuando exista un dominio propio.

## Próximos pasos

1. Confirmar que GitHub Pages termine de construir el sitio.
2. Probar un registro real en Supabase.
3. Convertir `pages/submit.html` en un formulario real conectado a `public.proposals`.
4. Conectar propuestas, votos, comentarios y perfiles a Supabase.

Para el contexto completo de continuidad, leer `HANDOFF-OTRA-IA.md`.
