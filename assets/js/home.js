// SDADI Community - portada con propuestas y proyectos reales de Supabase
(async function(){
  const core = window.SDADI_CORE;
  const supabase = core?.client?.();
  const proposalsGrid = document.querySelector('#home-proposals');
  const projectsGrid = document.querySelector('#home-projects');
  const source = document.querySelector('#stats-source');
  if(!proposalsGrid) return;

  const setStat = (id, value) => {
    const node = document.querySelector(id);
    if(node) node.textContent = new Intl.NumberFormat('es').format(value);
  };

  if(!supabase){
    if(source) source.textContent = 'Modo sin conexión';
    proposalsGrid.innerHTML = '<div class="empty-state"><h3>Sin conexión</h3><p>No se pudo conectar a la base de datos de la comunidad.</p></div>';
    return;
  }

  try {
    const [proposalsRes, proposalsCountRes, projectsRes, membersRes] = await Promise.all([
      supabase
        .from('proposals')
        .select('id,title,description,category,status,tags,created_at,profiles(display_name,username),votes(count),comments(count)')
        .neq('status','Archivada')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'Archivada'),
      supabase
        .from('projects')
        .select('id,title,description,category,status,progress,github_url,created_at,profiles(display_name,username),project_members(status)')
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
    ]);

    // Actualizar estadísticas reales
    setStat('#stat-proposals', proposalsCountRes.count || 0);
    setStat('#stat-projects', projectsRes.count || (projectsRes.data ? projectsRes.data.length : 0));
    setStat('#stat-members', membersRes.count || 0);
    if(source) source.textContent = 'Datos en vivo de Supabase';

    // Renderizar propuestas reales
    if(proposalsRes.data && proposalsRes.data.length > 0){
      proposalsGrid.innerHTML = proposalsRes.data.map(item => core.proposalCard(item, 'pages/')).join('');
    } else {
      proposalsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>Aún no hay propuestas publicadas</h3>
          <p>SDADI Community acaba de abrir sus puertas. ¡Sé la primera persona en compartir una idea con impacto!</p>
          <a class="button button-primary" href="pages/submit.html">Publicar la primera propuesta →</a>
        </div>
      `;
    }

    // Renderizar proyectos reales si existe el contenedor
    if(projectsGrid){
      if(projectsRes.data && projectsRes.data.length > 0){
        const projectCardsHtml = projectsRes.data.map(item => {
          const owner = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          const ownerName = owner?.display_name || owner?.username || 'Miembro de la comunidad';
          const members = (item.project_members || []).filter(m => m.status === 'Aceptado').length;
          const progress = Math.min(100, Math.max(0, Number(item.progress) || 0));
          const github = item.github_url ? `<a class="text-link" href="${core.escapeHtml(item.github_url)}" target="_blank" rel="noopener noreferrer">Repositorio ↗</a>` : '';

          return `
            <article class="project-card project-card-real">
              <div class="project-card-top">
                <span class="project-icon">◒</span>
                <span class="tag tag-blue">${core.escapeHtml(item.status)}</span>
              </div>
              <h3>${core.escapeHtml(item.title)}</h3>
              <p>${core.escapeHtml(item.description)}</p>
              <div class="progress-label"><span>Progreso</span><strong>${progress}%</strong></div>
              <div class="progress-bar"><span style="width:${progress}%"></span></div>
              <div class="project-meta">
                <span>◉ ${members} ${members === 1 ? 'colaborador' : 'colaboradores'}</span>
                <span>${core.escapeHtml(item.category)}</span>
              </div>
              <p class="field-hint">Responsable: ${core.escapeHtml(ownerName)}</p>
              <div class="project-actions">
                ${github}
                <a class="button button-secondary" href="pages/projects.html">Ver proyecto →</a>
              </div>
            </article>
          `;
        }).join('');

        const inviteCard = `
          <article class="project-card project-card-invite">
            <span class="invite-mark">＋</span>
            <h3>¿Tienes una propuesta lista para crecer?</h3>
            <p>Conecta con colaboradores y convierte una idea aprobada en un proyecto abierto.</p>
            <a class="text-link" href="pages/projects.html">Ir a proyectos <span aria-hidden="true">→</span></a>
          </article>
        `;

        projectsGrid.innerHTML = projectCardsHtml + inviteCard;
      } else {
        projectsGrid.innerHTML = `
          <article class="project-card project-card-invite" style="grid-column: 1 / -1;">
            <span class="invite-mark">＋</span>
            <h3>Los proyectos nacen de las ideas</h3>
            <p>Cuando una propuesta encuentra colaboradores interesados, se transforma en un proyecto en marcha.</p>
            <div style="margin-top:16px;">
              <a class="button button-primary" href="pages/submit.html">Publicar una propuesta →</a>
              <a class="button button-secondary" href="pages/explore.html" style="margin-left:8px;">Explorar propuestas</a>
            </div>
          </article>
        `;
      }
    }
  } catch(err){
    console.error('Error cargando portada:', err);
    if(source) source.textContent = 'Error de conexión';
  }
})();
