# SDADI Community

Base visual de la plataforma abierta de ideas, innovación y colaboración comunitaria.

## Fase actual

La Fase 1 está enfocada en la fundación visual:

- Portada responsive con hero, estadísticas demo, propuestas destacadas, proyectos y llamado a participar.
- Sistema visual centralizado en CSS con la paleta de SDADI.
- Header y footer reutilizables renderizados desde JavaScript.
- Navegación adaptable para móvil.
- Páginas de destino preparadas para las próximas fases.
- Sin credenciales ni datos presentados como reales: la portada muestra un aviso de datos de demostración.

La Fase 2 añade:

- Explorador de propuestas con búsqueda por texto.
- Filtros por categoría y estado.
- Orden por propuestas recientes, más apoyadas o más comentadas.
- Tarjetas enlazadas a detalles individuales mediante `?id=`.
- Detalle de propuesta con problema, solución, autor, estado y métricas demo.
- Estados vacíos y avisos claros cuando una acción requiere Supabase.

## Ejecutar localmente

Como es un sitio estático, puedes abrir `index.html` directamente en el navegador. Para una prueba más parecida a GitHub Pages, sirve la carpeta con cualquier servidor HTTP estático y visita la dirección indicada por ese servidor.

También puedes publicar esta carpeta en GitHub Pages desde **Settings → Pages → Deploy from a branch → main → /(root)**.


## Estructura

```text
index.html
404.html
pages/                 Páginas públicas y destinos de navegación
assets/css/            Sistema visual y responsive
assets/js/             Navegación, notificaciones y datos demo
```

La integración con Supabase, autenticación, propuestas persistentes, votos y comentarios quedan para las siguientes fases. No se han simulado como funcionales.

## Configuración de Supabase

La URL y la clave pública están preparadas en `config/supabase.js`. La clave `publishable` puede aparecer en el frontend, pero las políticas RLS deben estar activadas antes de consultar o modificar tablas desde la web. Nunca uses una clave `service_role` en estos archivos.

Para crear la base de datos en Supabase, abre **SQL Editor**, ejecuta primero `database/schema.sql` y después `database/policies.sql`. El segundo archivo activa RLS y limita las operaciones a los usuarios autorizados.

