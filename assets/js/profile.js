// SDADI Community - perfil real del usuario

(async function(){
  const core=window.SDADI_CORE;
  const area=document.querySelector('#profile-area');
  if(!area)return;

  const supabase=core.client();
  if(!supabase){
    core.renderNotice(area,'Sin conexión con Supabase','No se pudo cargar el cliente de datos. Revisa tu conexión y recarga la página.');
    return;
  }

  const session=await core.getSession();
  if(!session){
    core.authRequired(area,'profile.html','El perfil muestra tus datos y tus propuestas, por eso necesita una cuenta.');
    return;
  }

  const {data:profile,error}=await supabase
    .from('profiles')
    .select('id,username,display_name,bio,avatar_url,created_at')
    .eq('id',session.user.id)
    .maybeSingle();

  if(error){
    core.renderError(area,error,()=>location.reload());
    return;
  }

  if(!profile){
    core.renderNotice(area,'Perfil incompleto','Tu cuenta existe, pero todavía no tiene una fila en profiles. Cierra sesión, vuelve a entrar y recarga esta página.');
    return;
  }

  const proposals=await supabase
    .from('proposals')
    .select('id,title,description,category,status,tags,created_at,profiles(display_name,username),votes(count),comments(count)')
    .eq('author_id',session.user.id)
    .order('created_at',{ascending:false});

  const items=proposals.data||[];
  const votesReceived=items.reduce((total,item)=>total+(item.votes?.[0]?.count||0),0);
  const initials=core.initial(profile.display_name||profile.username);

  area.innerHTML=`<section class="profile-card" aria-labelledby="profile-name"><div class="profile-identity"><span class="profile-avatar" aria-hidden="true">${core.escapeHtml(initials)}</span><div><h2 id="profile-name">${core.escapeHtml(profile.display_name)}</h2><p class="profile-username">@${core.escapeHtml(profile.username)}</p><p class="profile-bio">${profile.bio?core.escapeHtml(profile.bio):'Todavía no has escrito una biografía.'}</p><p class="field-hint">Miembro desde ${core.escapeHtml(core.formatDate(profile.created_at))}</p></div></div><div class="profile-stats"><div><strong>${items.length}</strong><span>propuestas</span></div><div><strong>${votesReceived}</strong><span>apoyos recibidos</span></div></div><div class="profile-actions"><a class="button button-primary" href="submit.html">Publicar propuesta</a><a class="button button-secondary" href="settings.html">Configuración</a></div></section><section class="submit-card" aria-labelledby="edit-title"><span class="section-kicker">Editar</span><h2 id="edit-title">Datos públicos</h2><p>Estos datos aparecen junto a tus propuestas y comentarios.</p><form id="profile-form" class="proposal-form"><label for="display_name">Nombre visible *</label><input id="display_name" name="display_name" type="text" minlength="1" maxlength="80" value="${core.escapeHtml(profile.display_name)}" required><label for="bio">Biografía</label><textarea id="bio" name="bio" maxlength="500">${core.escapeHtml(profile.bio||'')}</textarea><p class="field-hint">Máximo 500 caracteres.</p><label for="avatar_url">URL de avatar</label><input id="avatar_url" name="avatar_url" type="url" maxlength="300" placeholder="https://" value="${core.escapeHtml(profile.avatar_url||'')}"><div class="form-actions"><button class="button button-primary" type="submit">Guardar cambios</button></div><div id="profile-message" class="auth-message" hidden role="status" aria-live="polite"></div></form></section><section class="section-block" aria-labelledby="my-proposals"><div class="section-heading"><div><span class="section-kicker">Aportes</span><h2 id="my-proposals">Mis propuestas</h2></div></div><div class="proposal-grid" id="my-proposal-grid">${items.length?items.map(item=>core.proposalCard(item,'')).join(''):'<div class="empty-state"><h3>Todavía no has publicado propuestas</h3><p>Comparte tu primera idea con la comunidad.</p><a class="button button-primary" href="submit.html">Publicar una idea →</a></div>'}</div></section>`;

  const form=area.querySelector('#profile-form');
  const box=area.querySelector('#profile-message');

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    box.hidden=true;

    const displayName=form.display_name.value.trim();
    const bio=form.bio.value.trim();
    const avatarUrl=form.avatar_url.value.trim();

    if(!displayName)return core.toast('El nombre visible no puede estar vacío.');
    if(bio.length>500)return core.toast('La biografía puede tener hasta 500 caracteres.');
    if(avatarUrl&&!/^https?:\/\/\S+$/i.test(avatarUrl))return core.toast('La URL del avatar debe empezar por http:// o https://.');

    const button=form.querySelector('button[type="submit"]');
    core.setBusy(button,true,'Guardando…');

    const {error:updateError}=await supabase
      .from('profiles')
      .update({display_name:displayName,bio,avatar_url:avatarUrl||null})
      .eq('id',session.user.id);

    core.setBusy(button,false);

    if(updateError){
      box.textContent=core.humanError(updateError,'No se pudieron guardar los cambios.');
      box.className='auth-message error';
      box.hidden=false;
      return;
    }

    box.textContent='Cambios guardados.';
    box.className='auth-message success';
    box.hidden=false;
    core.toast('Perfil actualizado.');
    area.querySelector('#profile-name').textContent=displayName;
  });
})();
