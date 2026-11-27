// SDADI Community - utilidades compartidas del cliente
// Depende de assets/js/supabase.js y de la CDN de supabase-js.

window.SDADI_CORE=(function(){
  function client(){return window.SDADI?.createSupabaseClient?.()||null}

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function initial(name){return (String(name||'S').trim()[0]||'S').toUpperCase()}

  function formatDate(value,withTime){
    const date=value?new Date(value):null;
    if(!date||Number.isNaN(date.getTime()))return 'fecha desconocida';
    const options=withTime?{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'long',year:'numeric'};
    return new Intl.DateTimeFormat('es',options).format(date);
  }

  function humanError(error,fallback){
    if(!error)return fallback||'No se pudo completar la operación.';
    if(error.code==='23503')return 'Tu perfil todavía no está listo. Vuelve a iniciar sesión e inténtalo de nuevo.';
    if(error.code==='23505')return 'Ese registro ya existe.';
    if(error.code==='23514')return 'Algún campo no cumple las reglas del servidor. Revisa la longitud y el formato.';
    if(error.code==='42501')return 'No tienes permiso para esta acción. Inicia sesión de nuevo.';
    if(error.code==='42703')return 'Falta aplicar una migración en Supabase. Revisa database/migrations.';
    if(error.code==='PGRST301'||error.status===401)return 'Tu sesión expiró. Inicia sesión de nuevo.';
    if(error.code==='PGRST116')return 'No encontramos el registro solicitado.';
    return error.message||fallback||'No se pudo completar la operación.';
  }

  function toast(message){
    if(typeof window.showToast==='function')window.showToast(message);
  }

  function setBusy(button,busy,label){
    if(!button)return;
    if(busy){
      button.dataset.label=button.dataset.label||button.textContent;
      button.disabled=true;
      if(label)button.textContent=label;
    }else{
      button.disabled=false;
      if(button.dataset.label)button.textContent=button.dataset.label;
    }
  }

  function rootPath(){return document.body.dataset.page==='home'?'':'../'}

  function loginHref(next){
    return `${rootPath()}pages/login.html?next=${encodeURIComponent(next||'')}`;
  }

  async function getSession(){
    const supabase=client();
    if(!supabase)return null;
    const {data}=await supabase.auth.getSession();
    return data.session||null;
  }

  function renderLoading(container,text){
    if(container)container.innerHTML=`<div class="placeholder-card"><p>${escapeHtml(text||'Cargando…')}</p></div>`;
  }

  function renderNotice(container,title,text,action){
    if(!container)return;
    container.innerHTML=`<div class="placeholder-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action||''}</div>`;
  }

  function renderError(container,error,retry){
    if(!container)return;
    container.innerHTML=`<div class="placeholder-card"><h3>No pudimos cargar esta sección.</h3><p>${escapeHtml(humanError(error,'Hubo un error de red. Inténtalo de nuevo.'))}</p><button class="button button-secondary" type="button" id="retry-button">Reintentar</button></div>`;
    container.querySelector('#retry-button')?.addEventListener('click',()=>retry?.());
  }

  function authRequired(container,next,text){
    if(!container)return;
    container.innerHTML=`<div class="auth-required"><span class="section-kicker">Acceso necesario</span><h2>Inicia sesión para continuar.</h2><p>${escapeHtml(text||'Necesitamos identificar tu cuenta para esta acción.')}</p><a class="button button-primary" href="${loginHref(next)}">Iniciar sesión →</a></div>`;
  }

  function proposalCard(item,pathPrefix){
    const prefix=pathPrefix??`${rootPath()}pages/`;
    const profile=Array.isArray(item.profiles)?item.profiles[0]:item.profiles;
    const authorName=profile?.display_name||profile?.username||'Miembro de la comunidad';
    const votes=item.votes?.[0]?.count??item.vote_count??0;
    const comments=item.comments?.[0]?.count??item.comment_count??0;
    const tags=Array.isArray(item.tags)?item.tags.slice(0,2):[];
    return `<article class="proposal-card"><div class="proposal-top"><span class="tag tag-blue">${escapeHtml(item.category)}</span><span class="tag tag-neutral">${escapeHtml(item.status)}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>${tags.length?`<div class="detail-tags">${tags.map(tag=>`<span class="tag tag-neutral">#${escapeHtml(tag)}</span>`).join('')}</div>`:''}<div class="proposal-meta"><span class="avatar">${escapeHtml(initial(authorName))}</span><span>${escapeHtml(authorName)}</span><span class="proposal-stats"><span>↗ ${escapeHtml(votes)}</span><span>◌ ${escapeHtml(comments)}</span></span></div><a class="card-link" href="${prefix}proposal.html?id=${encodeURIComponent(item.id)}">Ver propuesta <span aria-hidden="true">→</span></a></article>`;
  }

  return {client,escapeHtml,initial,formatDate,humanError,toast,setBusy,rootPath,loginHref,getSession,renderLoading,renderNotice,renderError,authRequired,proposalCard};
})();
