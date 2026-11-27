// SDADI Community - proyectos y colaboraciones

(function(){
  const core=window.SDADI_CORE;
  const area=document.querySelector('#projects-area');
  const createSection=document.querySelector('#project-create');
  const form=document.querySelector('#project-form');
  const messageBox=document.querySelector('#project-message');
  if(!area)return;

  const supabase=core.client();
  let session=null;
  let projects=[];

  function memberCount(item){
    return (item.project_members||[]).filter(member=>member.status==='Aceptado').length;
  }

  function projectCard(item){
    const owner=Array.isArray(item.profiles)?item.profiles[0]:item.profiles;
    const ownerName=owner?.display_name||owner?.username||'Miembro de la comunidad';
    const own=session&&item.owner_id===session.user.id;
    const members=memberCount(item);
    const progress=Number(item.progress)||0;
    const github=item.github_url?`<a class="text-link" href="${core.escapeHtml(item.github_url)}" target="_blank" rel="noopener noreferrer">Repositorio ↗</a>`:'';
    return `<article class="project-card project-card-real"><div class="project-card-top"><span class="project-icon">◒</span><span class="tag tag-blue">${core.escapeHtml(item.status)}</span></div><h3>${core.escapeHtml(item.title)}</h3><p>${core.escapeHtml(item.description)}</p><div class="progress-label"><span>Progreso</span><strong>${progress}%</strong></div><div class="progress-bar"><span style="width:${progress}%"></span></div><div class="project-meta"><span>◉ ${members} ${members===1?'colaborador':'colaboradores'}</span><span>${core.escapeHtml(item.category)}</span></div><p class="field-hint">Responsable: ${core.escapeHtml(ownerName)} · ${core.escapeHtml(core.formatDate(item.created_at))}</p><div class="project-actions">${github}${own?'<span class="tag tag-neutral">Tu proyecto</span>':session?`<button class="button button-secondary" type="button" data-join="${core.escapeHtml(item.id)}">Solicitar colaborar</button>`:`<a class="button button-secondary" href="${core.loginHref('projects.html')}">Inicia sesión para colaborar</a>`}</div></article>`;
  }

  async function load(){
    core.renderLoading(area,'Cargando proyectos de la comunidad…');

    if(!supabase){
      core.renderNotice(area,'Sin conexión con Supabase','No se pudo cargar el cliente de datos. Revisa tu conexión y recarga la página.');
      return;
    }

    session=await core.getSession();
    if(createSection)createSection.hidden=!session;

    const {data,error}=await supabase
      .from('projects')
      .select('id,title,description,category,status,progress,github_url,owner_id,created_at,profiles(display_name,username),project_members(status)')
      .order('created_at',{ascending:false});

    if(error){
      core.renderError(area,error,load);
      return;
    }

    projects=data||[];

    const grid=projects.length
      ? `<div class="project-grid">${projects.map(projectCard).join('')}</div>`
      : '<div class="empty-state"><h3>Todavía no hay proyectos</h3><p>Un proyecto nace cuando una propuesta encuentra personas dispuestas a construirla.</p><a class="button button-primary" href="explore.html">Explorar propuestas →</a></div>';

    area.innerHTML=grid;

    area.querySelectorAll('[data-join]').forEach(button=>button.addEventListener('click',()=>joinProject(button)));

    if(session)renderPendingRequests();
  }

  async function joinProject(button){
    if(!session){
      location.href=core.loginHref('projects.html');
      return;
    }
    const projectId=button.dataset.join;
    core.setBusy(button,true,'Enviando…');

    const {error}=await supabase.from('project_members').insert({project_id:projectId,user_id:session.user.id});

    core.setBusy(button,false);

    if(error&&error.code!=='23505'){
      core.toast(core.humanError(error,'No se pudo enviar la solicitud.'));
      return;
    }

    button.textContent='Solicitud enviada';
    button.disabled=true;
    core.toast(error?.code==='23505'?'Ya habías solicitado colaborar en este proyecto.':'Solicitud enviada. El responsable decidirá si acepta.');
  }

  async function renderPendingRequests(){
    const ownIds=projects.filter(project=>project.owner_id===session.user.id).map(project=>project.id);
    if(!ownIds.length)return;

    const {data,error}=await supabase
      .from('project_members')
      .select('id,status,project_id,user_id,profiles(display_name,username),projects(title)')
      .in('project_id',ownIds)
      .eq('status','Pendiente');

    if(error||!data?.length)return;

    const section=document.createElement('section');
    section.className='submit-card';
    section.setAttribute('aria-labelledby','pending-title');
    section.innerHTML=`<span class="section-kicker">Colaboraciones</span><h2 id="pending-title">Solicitudes pendientes</h2><div class="request-list">${data.map(request=>{
      const person=Array.isArray(request.profiles)?request.profiles[0]:request.profiles;
      const project=Array.isArray(request.projects)?request.projects[0]:request.projects;
      const name=person?.display_name||person?.username||'Miembro de la comunidad';
      return `<div class="request-row"><div><strong>${core.escapeHtml(name)}</strong><p class="field-hint">Quiere colaborar en «${core.escapeHtml(project?.title||'tu proyecto')}»</p></div><div class="request-actions"><button class="button button-primary" type="button" data-request="${core.escapeHtml(request.id)}" data-status="Aceptado">Aceptar</button><button class="button button-secondary" type="button" data-request="${core.escapeHtml(request.id)}" data-status="Rechazado">Rechazar</button></div></div>`;
    }).join('')}</div>`;
    area.appendChild(section);

    section.querySelectorAll('[data-request]').forEach(button=>button.addEventListener('click',()=>decideRequest(button)));
  }

  async function decideRequest(button){
    const requestId=button.dataset.request;
    const status=button.dataset.status;
    button.disabled=true;

    const {error}=await supabase.from('project_members').update({status}).eq('id',requestId);

    if(error){
      button.disabled=false;
      core.toast(core.humanError(error,'No se pudo actualizar la solicitud.'));
      return;
    }
    core.toast(status==='Aceptado'?'Colaboración aceptada.':'Solicitud rechazada.');
    load();
  }

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!session){
      location.href=core.loginHref('projects.html');
      return;
    }

    const title=form.title.value.trim();
    const description=form.description.value.trim();
    const category=form.category.value;
    const status=form.status.value;
    const githubUrl=form.github_url.value.trim();

    if(title.length<5||title.length>140)return setMessage('El título debe tener entre 5 y 140 caracteres.','error');
    if(description.length<20||description.length>3000)return setMessage('La descripción debe tener entre 20 y 3000 caracteres.','error');
    if(!category)return setMessage('Elige una categoría.','error');
    if(githubUrl&&!/^https:\/\/github\.com\/\S+$/i.test(githubUrl))return setMessage('El repositorio debe empezar por https://github.com/.','error');

    const button=form.querySelector('button[type="submit"]');
    core.setBusy(button,true,'Creando…');

    const {error}=await supabase.from('projects').insert({
      owner_id:session.user.id,
      title,
      description,
      category,
      status,
      github_url:githubUrl||null
    });

    core.setBusy(button,false);

    if(error)return setMessage(core.humanError(error,'No se pudo crear el proyecto.'),'error');

    form.reset();
    setMessage('Proyecto creado correctamente.','success');
    await load();
  });

  function setMessage(text,type){
    if(!messageBox)return;
    messageBox.textContent=text;
    messageBox.className=`auth-message ${type}`;
    messageBox.hidden=false;
  }

  load();
})();
