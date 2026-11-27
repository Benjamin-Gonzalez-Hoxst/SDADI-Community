// SDADI Community - propuestas reales en Supabase
// Publicación, detalle, votos, comentarios, reportes, edición y eliminación.
(function(){
  const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const MAX_TAGS=5;
  const MAX_TAG_LENGTH=20;
  const core=window.SDADI_CORE;

  function escapeHtml(value){return core.escapeHtml(value)}
  function formatDate(value){return core.formatDate(value,true)}

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

  async function initSubmitPage(){
    const loading=document.querySelector('#submit-loading');
    const guest=document.querySelector('#submit-guest');
    const panel=document.querySelector('#submit-panel');
    if(!loading||!guest||!panel)return;

    const client=core.client();
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
      const tags=parseTags(field('tags').value);
      const linkUrl=field('link_url').value.trim();

      // Validación: solo título, resumen y categoría son obligatorios
      if(title.length<5||title.length>140)return setMessage(messageBox,'El título debe tener entre 5 y 140 caracteres.','error');
      if(description.length<20||description.length>2000)return setMessage(messageBox,'El resumen debe tener entre 20 y 2000 caracteres.','error');
      if(!category)return setMessage(messageBox,'Elige una categoría.','error');
      if(tags.length>MAX_TAGS)return setMessage(messageBox,`Puedes usar como máximo ${MAX_TAGS} etiquetas.`,'error');
      if(tags.some(tag=>tag.length>MAX_TAG_LENGTH))return setMessage(messageBox,`Cada etiqueta puede tener hasta ${MAX_TAG_LENGTH} caracteres.`,'error');
      if(linkUrl&&!/^https?:\/\/\S+$/i.test(linkUrl))return setMessage(messageBox,'El enlace debe empezar por http:// o https://.','error');

      // Si problema o solución están vacíos, se completan de forma transparente para la base de datos
      const finalProblem = problem.length >= 20 ? problem : description;
      const finalSolution = solution.length >= 20 ? solution : (description.length >= 20 ? description : 'Propuesta abierta a soluciones colaborativas.');

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
          problem: finalProblem,
          solution: finalSolution,
          category,
          tags,
          link_url:linkUrl||null
        })
        .select('id')
        .single();

      if(insertError||!created){
        button.disabled=false;
        button.textContent=originalLabel;
        setMessage(messageBox,core.humanError(insertError,'No se pudo publicar la propuesta.'),'error');
        return;
      }

      location.href=`proposal.html?id=${encodeURIComponent(created.id)}`;
    });
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

  function authorOf(row){
    const profile=Array.isArray(row.profiles)?row.profiles[0]:row.profiles;
    return {name:profile?.display_name||profile?.username||'Miembro de la comunidad',id:row.author_id||row.user_id};
  }

  async function renderRealProposal(container,item){
    const author=authorOf(item);
    const tags=Array.isArray(item.tags)?item.tags.filter(Boolean):[];
    const link=item.link_url?`<p class="detail-link"><a class="text-link" href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener noreferrer">Enlace relacionado ↗</a></p>`:'';

    const session=await core.getSession();
    const isAuthor=session && session.user.id === author.id;

    // Solo mostrar secciones separadas de problema y solución si fueron ingresadas específicamente
    const showProblem = item.problem && item.problem !== item.description && !item.problem.startsWith('Propuesta comunitaria abierta');
    const showSolution = item.solution && item.solution !== item.description && !item.solution.startsWith('Propuesta abierta a soluciones');

    document.title=`${item.title} — SDADI Community`;
    container.dataset.real='supabase';
    container.innerHTML=`
      <div class="detail-top">
        <a class="text-link" href="explore.html">← Volver a explorar</a>
        <div class="detail-top-actions">
          <span class="tag tag-green">${escapeHtml(item.status)}</span>
          <button class="button button-secondary" type="button" id="share-button">Compartir ↗</button>
          ${isAuthor ? `
            <button class="button button-secondary" type="button" id="edit-button">Editar</button>
            <button class="button button-secondary" type="button" id="archive-button">Archivar</button>
            <button class="button button-secondary" type="button" id="delete-button" style="color:var(--red); border-color:#fca5a5;">Eliminar propuesta</button>
          ` : `
            <button class="button button-secondary" type="button" id="report-button">Reportar</button>
          `}
        </div>
      </div>
      <div class="detail-heading">
        <div>
          <div class="detail-tags">
            <span class="tag tag-blue">${escapeHtml(item.category)}</span>
            <span class="tag tag-neutral">${escapeHtml(item.status)}</span>
          </div>
          <h1>${escapeHtml(item.title)}</h1>
          <div class="detail-author">
            <span class="avatar">${escapeHtml(core.initial(author.name))}</span>
            <span>Propuesta de <strong>${escapeHtml(author.name)}</strong> · Publicada el ${escapeHtml(core.formatDate(item.created_at))}</span>
          </div>
        </div>
      </div>
      <div class="detail-layout">
        <article class="detail-content">
          <p class="detail-intro">${escapeHtml(item.description)}</p>
          ${showProblem ? `<h2>El problema</h2><p style="white-space: pre-line;">${escapeHtml(item.problem)}</p>` : ''}
          ${showSolution ? `<h2>La solución propuesta</h2><p style="white-space: pre-line;">${escapeHtml(item.solution)}</p>` : ''}
          ${link}
          ${tags.length?`<div class="detail-tags detail-tags-wrap">${tags.map(tag=>`<span class="tag tag-neutral">#${escapeHtml(tag)}</span>`).join('')}</div>`:''}
          <div class="detail-actions">
            <button class="button button-primary vote-button" type="button" id="vote-button" aria-pressed="false">Apoyar propuesta · <span id="vote-count">0</span></button>
            ${isAuthor ? `<button class="button button-secondary" type="button" id="delete-bottom-button" style="color:var(--red); border-color:#fca5a5;">Eliminar propuesta</button>` : ''}
          </div>
          <section class="comments-section" aria-labelledby="comments-title">
            <div class="comments-heading">
              <h2 id="comments-title">Comentarios · <span id="comment-count">0</span></h2>
            </div>
            <div id="comment-form-wrap" class="comment-form-wrap"></div>
            <div id="comments-list" class="comments-list" aria-live="polite"></div>
          </section>
        </article>
        <aside class="detail-side">
          <div class="side-stat"><strong id="side-vote-count">0</strong><span>personas apoyan esta idea</span></div>
          <div class="side-stat"><strong id="side-comment-count">0</strong><span>comentarios de la comunidad</span></div>
          <div class="side-related">
            <span class="section-kicker">Siguiente paso</span>
            <h3>¿Puedes aportar una perspectiva?</h3>
            <p>Comparte tu experiencia en los comentarios o apoya la propuesta para que avance hacia un proyecto colaborativo.</p>
          </div>
        </aside>
      </div>

      <!-- Diálogo de reporte -->
      <dialog id="report-dialog" class="report-dialog" aria-labelledby="report-title">
        <form method="dialog" id="report-form">
          <h2 id="report-title">Reportar propuesta</h2>
          <p>Cuéntanos qué problema tiene este contenido. El equipo lo revisará.</p>
          <label for="report-reason">Motivo *</label>
          <textarea id="report-reason" name="reason" minlength="5" maxlength="1000" required></textarea>
          <div class="dialog-actions">
            <button class="button button-secondary" type="button" id="report-cancel">Cancelar</button>
            <button class="button button-primary" type="submit">Enviar reporte</button>
          </div>
          <div id="report-message" class="auth-message" hidden role="status"></div>
        </form>
      </dialog>

      <!-- Diálogo de edición para el autor -->
      <dialog id="edit-dialog" class="report-dialog" aria-labelledby="edit-proposal-title">
        <form method="dialog" id="edit-proposal-form" class="proposal-form" style="max-height:85vh; overflow-y:auto; padding-right:8px;">
          <h2 id="edit-proposal-title">Editar propuesta</h2>
          <label for="edit-title">Título *</label>
          <input id="edit-title" name="title" type="text" minlength="5" maxlength="140" required value="${escapeHtml(item.title)}">

          <label for="edit-description">Resumen *</label>
          <textarea id="edit-description" name="description" minlength="20" maxlength="2000" required>${escapeHtml(item.description)}</textarea>

          <label for="edit-problem">El problema <span style="font-weight:normal; color:var(--muted);">(opcional)</span></label>
          <textarea id="edit-problem" name="problem" maxlength="3000">${escapeHtml(showProblem ? item.problem : '')}</textarea>

          <label for="edit-solution">La solución propuesta <span style="font-weight:normal; color:var(--muted);">(opcional)</span></label>
          <textarea id="edit-solution" name="solution" maxlength="3000">${escapeHtml(showSolution ? item.solution : '')}</textarea>

          <label for="edit-category">Categoría *</label>
          <select id="edit-category" name="category" required>
            ${['Tecnología','Educación','Medioambiente','Comunidad','Salud y bienestar','Ciencia','Software','Diseño','Innovación','Otros'].map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>

          <label for="edit-tags">Etiquetas</label>
          <input id="edit-tags" name="tags" type="text" maxlength="120" value="${escapeHtml((item.tags || []).join(', '))}">
          <p class="field-hint">Separadas por comas. Máximo 5.</p>

          <label for="edit-link">Enlace opcional</label>
          <input id="edit-link" name="link_url" type="url" maxlength="300" value="${escapeHtml(item.link_url || '')}">

          <div class="dialog-actions" style="margin-top:16px;">
            <button class="button button-secondary" type="button" id="edit-cancel">Cancelar</button>
            <button class="button button-primary" type="submit">Guardar cambios</button>
          </div>
          <div id="edit-message" class="auth-message" hidden role="status"></div>
        </form>
      </dialog>
    `;

    initShare(container,item);
    initReport(container,item);
    initVotes(container,item);
    initComments(container,item);

    if(isAuthor){
      initAuthorActions(container, item);
    }
  }

  function initAuthorActions(container, item){
    const editBtn = container.querySelector('#edit-button');
    const archiveBtn = container.querySelector('#archive-button');
    const deleteBtn = container.querySelector('#delete-button');
    const editDialog = container.querySelector('#edit-dialog');
    const editForm = container.querySelector('#edit-proposal-form');
    const editMsg = container.querySelector('#edit-message');
    const cancelBtn = container.querySelector('#edit-cancel');
    const supabase = core.client();

    editBtn?.addEventListener('click', () => {
      clearMessage(editMsg);
      if(typeof editDialog.showModal === 'function') editDialog.showModal();
      else editDialog.setAttribute('open', '');
    });

    cancelBtn?.addEventListener('click', () => editDialog.close());

    editForm?.addEventListener('submit', async event => {
      event.preventDefault();
      clearMessage(editMsg);

      const title = editForm.title.value.trim();
      const description = editForm.description.value.trim();
      const problem = editForm.problem.value.trim();
      const solution = editForm.solution.value.trim();
      const category = editForm.category.value;
      const tags = parseTags(editForm.tags.value);
      const linkUrl = editForm.link_url.value.trim();

      if(title.length<5||title.length>140) return setMessage(editMsg,'El título debe tener entre 5 y 140 caracteres.','error');
      if(description.length<20||description.length>2000) return setMessage(editMsg,'El resumen debe tener entre 20 y 2000 caracteres.','error');
      if(!category) return setMessage(editMsg,'Elige una categoría.','error');
      if(linkUrl&&!/^https?:\/\/\S+$/i.test(linkUrl)) return setMessage(editMsg,'El enlace debe empezar por http:// o https://.','error');

      const finalProblem = problem.length >= 20 ? problem : description;
      const finalSolution = solution.length >= 20 ? solution : (description.length >= 20 ? description : 'Propuesta abierta a soluciones colaborativas.');

      const submitBtn = editForm.querySelector('button[type="submit"]');
      core.setBusy(submitBtn, true, 'Guardando…');

      const { error } = await supabase
        .from('proposals')
        .update({
          title,
          description,
          problem: finalProblem,
          solution: finalSolution,
          category,
          tags,
          link_url: linkUrl || null
        })
        .eq('id', item.id);

      core.setBusy(submitBtn, false);

      if(error){
        return setMessage(editMsg, core.humanError(error, 'No se pudieron guardar los cambios.'), 'error');
      }

      core.toast('Propuesta actualizada con éxito.');
      editDialog.close();
      location.reload();
    });

    archiveBtn?.addEventListener('click', async () => {
      if(!confirm('¿Deseas archivar esta propuesta? Dejará de ser pública en el explorador.')) return;
      archiveBtn.disabled = true;
      archiveBtn.textContent = 'Archivando…';

      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Archivada' })
        .eq('id', item.id);

      if(error){
        core.toast(core.humanError(error, 'No se pudo archivar la propuesta.'));
        archiveBtn.disabled = false;
        archiveBtn.textContent = 'Archivar';
        return;
      }

      core.toast('Propuesta archivada.');
      location.href = 'explore.html';
    });

    const bottomDeleteBtn = container.querySelector('#delete-bottom-button');

    const handleDelete = async () => {
      if(!confirm('¿Estás seguro de que deseas eliminar permanentemente esta propuesta? Esta acción borrará la propuesta, sus votos y comentarios asociados de manera definitiva.')) return;
      if(deleteBtn){ deleteBtn.disabled = true; deleteBtn.textContent = 'Eliminando…'; }
      if(bottomDeleteBtn){ bottomDeleteBtn.disabled = true; bottomDeleteBtn.textContent = 'Eliminando…'; }

      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', item.id);

      if(error){
        core.toast(core.humanError(error, 'No se pudo eliminar la propuesta.'));
        if(deleteBtn){ deleteBtn.disabled = false; deleteBtn.textContent = 'Eliminar propuesta'; }
        if(bottomDeleteBtn){ bottomDeleteBtn.disabled = false; bottomDeleteBtn.textContent = 'Eliminar propuesta'; }
        return;
      }

      core.toast('Propuesta eliminada definitivamente.');
      location.href = 'explore.html';
    };

    deleteBtn?.addEventListener('click', handleDelete);
    bottomDeleteBtn?.addEventListener('click', handleDelete);
  }

  function initShare(container,item){
    container.querySelector('#share-button')?.addEventListener('click',async()=>{
      const url=location.href;
      try{
        if(navigator.share)await navigator.share({title:item.title,text:item.description,url});
        else{
          await navigator.clipboard.writeText(url);
          core.toast('Enlace copiado al portapapeles.');
        }
      }catch(error){
        if(error?.name!=='AbortError')core.toast('No se pudo compartir el enlace.');
      }
    });
  }

  function initReport(container,item){
    const dialog=container.querySelector('#report-dialog');
    const form=container.querySelector('#report-form');
    const message=container.querySelector('#report-message');
    if(!dialog||!form)return;

    container.querySelector('#report-button')?.addEventListener('click',async()=>{
      const session=await core.getSession();
      if(!session){
        location.href=core.loginHref(`proposal.html?id=${item.id}`);
        return;
      }
      clearMessage(message);
      form.reset();
      if(typeof dialog.showModal==='function')dialog.showModal();
      else dialog.setAttribute('open','');
    });

    container.querySelector('#report-cancel')?.addEventListener('click',()=>dialog.close());

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      clearMessage(message);
      const reason=form.reason.value.trim();
      if(reason.length<5)return setMessage(message,'Escribe al menos 5 caracteres.','error');

      const supabase=core.client();
      const session=await core.getSession();
      if(!supabase||!session)return setMessage(message,'Tu sesión expiró. Inicia sesión de nuevo.','error');

      const button=form.querySelector('button[type="submit"]');
      button.disabled=true;
      const {error}=await supabase.from('reports').insert({
        reporter_id:session.user.id,
        content_type:'proposal',
        content_id:item.id,
        reason
      });
      button.disabled=false;

      if(error)return setMessage(message,core.humanError(error,'No se pudo enviar el reporte.'),'error');
      dialog.close();
      core.toast('Reporte enviado. Gracias por ayudar a cuidar la comunidad.');
    });
  }

  async function initVotes(container,item){
    const supabase=core.client();
    const button=container.querySelector('#vote-button');
    if(!supabase||!button)return;

    const label=button.querySelector('#vote-count');
    const side=container.querySelector('#side-vote-count');
    let voted=false;
    let busy=false;

    async function refresh(){
      const session=await core.getSession();
      const [countRes, userVoteRes] = await Promise.all([
        supabase.from('votes').select('id', { count: 'exact', head: true }).eq('proposal_id', item.id),
        session ? supabase.from('votes').select('id').eq('proposal_id', item.id).eq('user_id', session.user.id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      const count = countRes.count || 0;
      voted = !!userVoteRes.data;

      if(label)label.textContent=count;
      if(side)side.textContent=count;
      button.setAttribute('aria-pressed',String(voted));
      button.classList.toggle('is-voted',voted);
      button.firstChild.textContent=voted?'Apoyada · ':'Apoyar propuesta · ';
      button.title=voted?'Quitar mi apoyo':'Apoyar esta propuesta';
    }

    button.addEventListener('click',async()=>{
      if(busy)return;
      const session=await core.getSession();
      if(!session){
        location.href=core.loginHref(`proposal.html?id=${item.id}`);
        return;
      }
      busy=true;
      button.disabled=true;

      const result=voted
        ? await supabase.from('votes').delete().eq('proposal_id',item.id).eq('user_id',session.user.id)
        : await supabase.from('votes').insert({proposal_id:item.id,user_id:session.user.id});

      busy=false;
      button.disabled=false;

      if(result.error&&result.error.code!=='23505'){
        core.toast(core.humanError(result.error,'No se pudo registrar tu apoyo.'));
        return;
      }
      await refresh();
    });

    refresh();
  }

  async function initComments(container,item){
    const supabase=core.client();
    const list=container.querySelector('#comments-list');
    const wrap=container.querySelector('#comment-form-wrap');
    const count=container.querySelector('#comment-count');
    const side=container.querySelector('#side-comment-count');
    if(!supabase||!list||!wrap)return;

    let replyTo=null;
    let commentPage=0;
    let comments=[];
    const COMMENT_PAGE_SIZE=30;

    function commentNode(comment, children, byParentMap){
      const author=authorOf(comment);
      const session=window.SDADI_CURRENT_SESSION;
      const own=session&&comment.author_id===session.user.id;
      const replies=children.length?`<div class="comment-replies">${children.map(child=>commentNode(child, byParentMap.get(child.id)||[], byParentMap)).join('')}</div>`:'';
      const deleteAction = own ? `<button class="text-link" type="button" data-delete-comment="${escapeHtml(comment.id)}" style="color:var(--red); margin-left:12px;">Eliminar</button>` : '';

      return `
        <article class="comment" id="comment-${escapeHtml(comment.id)}">
          <div class="comment-head">
            <span class="avatar">${escapeHtml(core.initial(author.name))}</span>
            <strong>${escapeHtml(author.name)}</strong>
            <time datetime="${escapeHtml(comment.created_at)}">${escapeHtml(core.formatDate(comment.created_at))}</time>
            ${own?'<span class="tag tag-neutral">Tú</span>':''}
          </div>
          <p class="comment-body">${escapeHtml(comment.content)}</p>
          <div class="comment-actions">
            <button class="text-link" type="button" data-reply="${escapeHtml(comment.id)}" data-name="${escapeHtml(author.name)}">Responder</button>
            ${deleteAction}
          </div>
          ${replies}
        </article>
      `;
    }

    async function renderForm(){
      const session=await core.getSession();
      window.SDADI_CURRENT_SESSION = session;
      if(!session){
        wrap.innerHTML=`<p class="comment-login"><a class="text-link" href="${core.loginHref(`proposal.html?id=${item.id}`)}">Inicia sesión</a> para comentar.</p>`;
        return;
      }
      const context=replyTo?`<div class="reply-context"><span>Respondiendo a <strong>${escapeHtml(replyTo.name)}</strong></span><button class="text-link" type="button" id="cancel-reply">Cancelar</button></div>`:'';
      wrap.innerHTML=`${context}<form id="comment-form" class="comment-form"><label class="sr-only" for="comment-content">Tu comentario</label><textarea id="comment-content" name="content" minlength="1" maxlength="2000" required placeholder="Comparte tu perspectiva…"></textarea><div class="comment-form-actions"><span class="field-hint">Máximo 2000 caracteres.</span><button class="button button-primary" type="submit">Comentar →</button></div><div id="comment-message" class="auth-message" hidden role="status"></div></form>`;
      wrap.querySelector('#cancel-reply')?.addEventListener('click',()=>{replyTo=null;renderForm()});
      wrap.querySelector('#comment-form')?.addEventListener('submit',submitComment);
    }

    async function submitComment(event){
      event.preventDefault();
      const form=event.currentTarget;
      const box=wrap.querySelector('#comment-message');
      const content=form.content.value.trim();
      if(!content)return setMessage(box,'Escribe un comentario.','error');

      const session = await core.getSession();
      if(!session){
        return setMessage(box, 'Tu sesión expiró. Inicia sesión de nuevo para comentar.', 'error');
      }

      const button=form.querySelector('button[type="submit"]');
      button.disabled=true;
      const {error}=await supabase.from('comments').insert({
        proposal_id:item.id,
        author_id:session.user.id,
        content,
        parent_id:replyTo?.id||null
      });
      button.disabled=false;

      if(error)return setMessage(box,core.humanError(error,'No se pudo publicar el comentario.'),'error');
      replyTo=null;
      form.reset();
      await load(true);
    }

    async function load(reset=false){
      if(reset){commentPage=0;comments=[];list.innerHTML='<p class="field-hint">Cargando comentarios…</p>';}
      const {data,error}=await supabase
        .from('comments')
        .select('id,content,parent_id,author_id,created_at,profiles(display_name,username)')
        .eq('proposal_id',item.id)
        .order('created_at',{ascending:true})
        .range(commentPage*COMMENT_PAGE_SIZE,commentPage*COMMENT_PAGE_SIZE+COMMENT_PAGE_SIZE-1);

      if(error){
        list.innerHTML=`<p class="field-hint">${escapeHtml(core.humanError(error,'No se pudieron cargar los comentarios.'))}</p>`;
        return;
      }

      comments=reset?(data||[]):comments.concat(data||[]);
      const hasMore=(data||[]).length===COMMENT_PAGE_SIZE;
      commentPage+=1;
      if(count)count.textContent=comments.length;
      if(side)side.textContent=comments.length;

      if(!comments.length){
        list.innerHTML='<p class="field-hint">Todavía no hay comentarios. Abre la conversación.</p>';
        return;
      }

      const byParent=new Map();
      comments.forEach(comment=>{
        const key=comment.parent_id||'root';
        if(!byParent.has(key))byParent.set(key,[]);
        byParent.get(key).push(comment);
      });

      list.innerHTML=(byParent.get('root')||[]).map(comment=>commentNode(comment,byParent.get(comment.id)||[], byParent)).join('');
      let more=list.parentElement.querySelector('#load-more-comments');
      if(!more){more=document.createElement('button');more.id='load-more-comments';more.type='button';more.className='button button-secondary';more.textContent='Cargar más comentarios';list.parentElement.appendChild(more);}
      more.hidden=!hasMore;
      more.onclick=()=>load(false);

      list.querySelectorAll('[data-reply]').forEach(button=>button.addEventListener('click',()=>{
        replyTo={id:button.dataset.reply,name:button.dataset.name};
        renderForm();
        wrap.querySelector('#comment-content')?.focus();
      }));

      list.querySelectorAll('[data-delete-comment]').forEach(button=>button.addEventListener('click', async ()=>{
        const commentId = button.dataset.deleteComment;
        if(!confirm('¿Deseas eliminar este comentario?')) return;
        button.disabled = true;
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if(error){
          core.toast(core.humanError(error, 'No se pudo eliminar el comentario.'));
          button.disabled = false;
          return;
        }
        core.toast('Comentario eliminado.');
        await load(true);
      }));
    }

    renderForm();
    load();
  }

  function renderNotFound(container,message){
    container.dataset.real='supabase';
    container.innerHTML=`<div class="placeholder-card"><span class="section-kicker">Propuesta</span><h2>No pudimos encontrar esta propuesta.</h2><p>${escapeHtml(message)}</p><a class="button button-primary" href="explore.html">Explorar propuestas activas →</a></div>`;
  }

  async function initProposalDetail(){
    const container=document.querySelector('#proposal-detail');
    if(!container)return;

    const id=new URLSearchParams(location.search).get('id')||'';
    if(!UUID_PATTERN.test(id)){
      renderNotFound(container,'El enlace no contiene un identificador válido de propuesta. Revisa el catálogo para encontrar ideas de la comunidad.');
      return;
    }

    const supabase=core.client();
    if(!supabase){
      renderNotFound(container,'No se pudo cargar el cliente de Supabase. Revisa tu conexión y recarga la página.');
      return;
    }

    const columns='id,author_id,title,description,problem,solution,category,status,tags,created_at,profiles(display_name,username)';
    let {data,error}=await supabase
      .from('proposals')
      .select(`${columns},link_url`)
      .eq('id',id)
      .maybeSingle();

    if(error?.code==='42703'){
      ({data,error}=await supabase
        .from('proposals')
        .select(columns)
        .eq('id',id)
        .maybeSingle());
    }

    if(error)return renderNotFound(container,error.code==='42501'?'Faltan permisos de tabla en Supabase. Ejecuta database/grants.sql en el SQL Editor.':'Hubo un error de red al cargar la propuesta. Inténtalo de nuevo en unos segundos.');
    if(!data)return renderNotFound(container,'Esta propuesta no existe o fue archivada por su autor.');

    renderRealProposal(container,data);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    initSubmitPage();
    initProposalDetail();
  });
})();
