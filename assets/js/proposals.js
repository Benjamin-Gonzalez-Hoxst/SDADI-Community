// SDADI Community - propuestas reales en Supabase
// Formulario de publicación y detalle dinámico. La seguridad depende de RLS.

(function(){
  const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const MAX_TAGS=5;
  const MAX_TAG_LENGTH=20;

  function proposalClient(){return window.SDADI?.createSupabaseClient?.()||null}

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function setMessage(box,text,type){
    if(!box)return;
    box.textContent=text;
    box.className=`auth-message ${type}`;
    box.hidden=false;
  }

  function clearMessage(box){
    if(!box)return;
    box.textContent='';
    box.hidden=true;
  }

  function formatDate(value){
    const date=value?new Date(value):null;
    if(!date||Number.isNaN(date.getTime()))return 'fecha desconocida';
    return new Intl.DateTimeFormat('es',{day:'numeric',month:'long',year:'numeric'}).format(date);
  }

  function parseTags(raw){
    const seen=new Set();
    return raw.split(',').map(tag=>tag.trim()).filter(tag=>{
      if(!tag)return false;
      const key=tag.toLowerCase();
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function humanError(error){
    if(!error)return 'No se pudo completar la operación.';
    if(error.code==='23503')return 'Tu perfil todavía no está listo en Supabase. Vuelve a iniciar sesión e inténtalo de nuevo.';
    if(error.code==='23514')return 'Algún campo no cumple las reglas del servidor. Revisa la longitud y el enlace.';
    if(error.code==='42703')return 'Falta aplicar database/migrations/001_proposals_link.sql en el SQL Editor de Supabase.';
    if(error.code==='42501')return 'Faltan permisos de tabla en Supabase. Ejecuta database/grants.sql en el SQL Editor.';
    if(error.code==='PGRST301'||error.status===401)return 'Tu sesión expiró. Inicia sesión de nuevo.';
    return error.message||'No se pudo publicar la propuesta. Inténtalo de nuevo.';
  }

  async function initSubmitPage(){
    const loading=document.querySelector('#submit-loading');
    const guest=document.querySelector('#submit-guest');
    const panel=document.querySelector('#submit-panel');
    if(!loading||!guest||!panel)return;

    const client=proposalClient();
    if(!client){
      loading.innerHTML='<p>No se pudo cargar el cliente de Supabase. Revisa tu conexión y recarga la página.</p>';
      return;
    }

    const {data,error}=await client.auth.getSession();
    loading.hidden=true;

    if(error||!data.session){
      guest.hidden=false;
      return;
    }

    panel.hidden=false;
    const form=document.querySelector('#proposal-form');
    const messageBox=document.querySelector('#proposal-message');
    if(!form)return;

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      clearMessage(messageBox);

      const field=name=>form.elements.namedItem(name);
      const button=form.querySelector('button[type="submit"]');
      const title=field('title').value.trim();
      const description=field('description').value.trim();
      const problem=field('problem').value.trim();
      const solution=field('solution').value.trim();
      const category=field('category').value;
      const rawTags=field('tags').value;
      const tags=parseTags(rawTags);
      const linkUrl=field('link_url').value.trim();

      if(title.length<5||title.length>140)return setMessage(messageBox,'El título debe tener entre 5 y 140 caracteres.','error');
      if(description.length<20||description.length>2000)return setMessage(messageBox,'El resumen debe tener entre 20 y 2000 caracteres.','error');
      if(problem.length<20||problem.length>3000)return setMessage(messageBox,'El problema debe tener entre 20 y 3000 caracteres.','error');
      if(solution.length<20||solution.length>3000)return setMessage(messageBox,'La solución debe tener entre 20 y 3000 caracteres.','error');
      if(!category)return setMessage(messageBox,'Elige una categoría.','error');
      if(tags.length>MAX_TAGS)return setMessage(messageBox,`Puedes usar como máximo ${MAX_TAGS} etiquetas.`,'error');
      if(tags.some(tag=>tag.length>MAX_TAG_LENGTH))return setMessage(messageBox,`Cada etiqueta puede tener hasta ${MAX_TAG_LENGTH} caracteres.`,'error');
      if(linkUrl&&!/^https?:\/\/\S+$/i.test(linkUrl))return setMessage(messageBox,'El enlace debe empezar por http:// o https://.','error');

      const {data:sessionData,error:sessionError}=await client.auth.getSession();
      if(sessionError||!sessionData.session)return setMessage(messageBox,'Tu sesión expiró. Inicia sesión de nuevo.','error');

      button.disabled=true;
      const originalLabel=button.textContent;
      button.textContent='Publicando…';

      const {data:created,error:insertError}=await client
        .from('proposals')
        .insert({
          author_id:sessionData.session.user.id,
          title,
          description,
          problem,
          solution,
          category,
          tags,
          link_url:linkUrl||null
        })
        .select('id')
        .single();

      if(insertError||!created){
        button.disabled=false;
        button.textContent=originalLabel;
        setMessage(messageBox,humanError(insertError),'error');
        return;
      }

      location.href=`proposal.html?id=${encodeURIComponent(created.id)}`;
    });
  }

  function renderRealProposal(container,item){
    const profile=Array.isArray(item.profiles)?item.profiles[0]:item.profiles;
    const authorName=profile?.display_name||profile?.username||'Miembro de la comunidad';
    const authorInitial=(authorName[0]||'S').toUpperCase();
    const tags=Array.isArray(item.tags)?item.tags.filter(Boolean):[];
    const link=item.link_url?`<p class="detail-link"><a class="text-link" href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener noreferrer">Enlace relacionado ↗</a></p>`:'';

    document.title=`${item.title} — SDADI Community`;
    container.innerHTML=`<div class="detail-top"><a class="text-link" href="explore.html">← Volver a explorar</a><span class="tag tag-green">Publicada</span></div><div class="detail-heading"><div><div class="detail-tags"><span class="tag tag-blue">${escapeHtml(item.category)}</span><span class="tag tag-neutral">${escapeHtml(item.status)}</span></div><h1>${escapeHtml(item.title)}</h1><div class="detail-author"><span class="avatar">${escapeHtml(authorInitial)}</span><span>Propuesta de <strong>${escapeHtml(authorName)}</strong> · Publicada el ${escapeHtml(formatDate(item.created_at))}</span></div></div><button class="button button-secondary" type="button" data-demo-action>Compartir ↗</button></div><div class="detail-layout"><article class="detail-content"><p class="detail-intro">${escapeHtml(item.description)}</p><h2>El problema</h2><p>${escapeHtml(item.problem)}</p><h2>La solución propuesta</h2><p>${escapeHtml(item.solution)}</p>${link}${tags.length?`<div class="detail-tags detail-tags-wrap">${tags.map(tag=>`<span class="tag tag-neutral">#${escapeHtml(tag)}</span>`).join('')}</div>`:''}<div class="detail-actions"><button class="button button-primary" type="button" data-demo-action>Apoyar propuesta</button><button class="button button-secondary" type="button" data-demo-action>Comentar</button></div></article><aside class="detail-side"><div class="side-stat"><strong>0</strong><span>personas apoyan esta idea</span></div><div class="side-stat"><strong>0</strong><span>comentarios de la comunidad</span></div><div class="side-related"><span class="section-kicker">Siguiente paso</span><h3>¿Puedes aportar una perspectiva?</h3><p>Los votos y comentarios se habilitarán en la siguiente iteración.</p></div></aside></div>`;

    container.querySelectorAll('[data-demo-action]').forEach(button=>button.addEventListener('click',()=>{
      if(typeof window.showToast==='function')window.showToast('Los votos y comentarios se habilitarán en la siguiente iteración.');
    }));
  }

  function renderNotFound(container,message){
    container.dataset.real='supabase';
    container.innerHTML=`<div class="placeholder-card"><span class="section-kicker">Propuesta</span><h2>No pudimos abrir esta propuesta.</h2><p>${escapeHtml(message)}</p><a class="button button-secondary" href="explore.html">Volver a explorar →</a></div>`;
  }

  async function initProposalDetail(){
    const container=document.querySelector('#proposal-detail');
    if(!container)return;

    const id=new URLSearchParams(location.search).get('id')||'';
    if(!UUID_PATTERN.test(id)){
      container.dataset.real='demo';
      if(typeof window.renderProposalDetail==='function')window.renderProposalDetail();
      return;
    }

    const client=proposalClient();
    if(!client){
      renderNotFound(container,'No se pudo cargar el cliente de Supabase. Revisa tu conexión y recarga la página.');
      return;
    }

    const columns='id,title,description,problem,solution,category,status,tags,created_at,profiles(display_name,username)';
    let {data,error}=await client
      .from('proposals')
      .select(`${columns},link_url`)
      .eq('id',id)
      .maybeSingle();

    if(error?.code==='42703'){
      ({data,error}=await client
        .from('proposals')
        .select(columns)
        .eq('id',id)
        .maybeSingle());
    }

    if(error)return renderNotFound(container,error.code==='42501'?'Faltan permisos de tabla en Supabase. Ejecuta database/grants.sql en el SQL Editor.':'Hubo un error de red al cargar la propuesta. Inténtalo de nuevo en unos segundos.');
    if(!data)return renderNotFound(container,'La propuesta no existe o fue archivada.');

    container.dataset.real='supabase';
    renderRealProposal(container,data);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    initSubmitPage();
    initProposalDetail();
  });
})();
