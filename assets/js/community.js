// SDADI Community - comunidad y debates reales en Supabase
(function(){
  const core = window.SDADI_CORE;
  const listContainer = document.querySelector('#community-list');
  const createSection = document.querySelector('#community-create');
  const form = document.querySelector('#community-form');
  const messageBox = document.querySelector('#community-message');
  const filterButtons = document.querySelectorAll('[data-community-filter]');
  if(!listContainer) return;

  const supabase = core?.client?.();
  let currentCategory = 'all';
  let session = null;
  let posts = [];

  function postCard(post){
    const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
    const authorName = author?.display_name || author?.username || 'Miembro de la comunidad';
    const isOwner = session && post.author_id === session.user.id;
    const categoryClass = {
      'Debate': 'tag-blue',
      'Anuncio': 'tag-green',
      'Pregunta': 'tag-neutral',
      'General': 'tag-neutral'
    }[post.category] || 'tag-neutral';

    return `
      <article class="proposal-card community-card" id="post-${core.escapeHtml(post.id)}">
        <div class="proposal-top">
          <span class="tag ${categoryClass}">${core.escapeHtml(post.category)}</span>
          <time class="field-hint" datetime="${core.escapeHtml(post.created_at)}">${core.escapeHtml(core.formatDate(post.created_at, true))}</time>
        </div>
        <h3>${core.escapeHtml(post.title)}</h3>
        <p style="white-space: pre-line;">${core.escapeHtml(post.content)}</p>
        <div class="proposal-meta">
          <span class="avatar">${core.escapeHtml(core.initial(authorName))}</span>
          <span>${core.escapeHtml(authorName)}</span>
          ${isOwner ? `<button class="text-link delete-post-btn" type="button" data-delete-post="${core.escapeHtml(post.id)}" style="margin-left:auto; color:var(--red);">Eliminar</button>` : ''}
        </div>
      </article>
    `;
  }

  function render(){
    const filtered = currentCategory === 'all'
      ? posts
      : posts.filter(p => p.category === currentCategory);

    if(!filtered.length){
      listContainer.innerHTML = `
        <div class="empty-state">
          <h3>No hay publicaciones en esta sección</h3>
          <p>${session ? 'Sé la primera persona en iniciar una conversación.' : 'Inicia sesión para abrir una nueva conversación con la comunidad.'}</p>
          ${!session ? `<a class="button button-primary" href="${core.loginHref('community.html')}">Iniciar sesión →</a>` : ''}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(postCard).join('');

    listContainer.querySelectorAll('[data-delete-post]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deletePost;
        if(!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;
        btn.disabled = true;
        btn.textContent = 'Eliminando…';
        const { error } = await supabase.from('community_posts').delete().eq('id', id);
        if(error){
          core.toast(core.humanError(error, 'No se pudo eliminar la publicación.'));
          btn.disabled = false;
          btn.textContent = 'Eliminar';
          return;
        }
        core.toast('Publicación eliminada.');
        await load();
      });
    });
  }

  async function load(){
    core.renderLoading(listContainer, 'Cargando conversaciones de la comunidad…');
    if(!supabase){
      core.renderNotice(listContainer, 'Sin conexión', 'No se pudo conectar con Supabase. Revisa tu conexión.');
      return;
    }

    session = await core.getSession();
    if(createSection){
      createSection.hidden = !session;
    }
    const guestNotice = document.querySelector('#community-guest-notice');
    if(guestNotice){
      guestNotice.hidden = !!session;
    }

    const { data, error } = await supabase
      .from('community_posts')
      .select('id, title, content, category, author_id, created_at, profiles(display_name, username)')
      .order('created_at', { ascending: false });

    if(error){
      core.renderError(listContainer, error, load);
      return;
    }

    posts = data || [];
    render();
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      currentCategory = btn.dataset.communityFilter;
      render();
    });
  });

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if(!session){
      location.href = core.loginHref('community.html');
      return;
    }

    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const category = form.category.value;

    if(title.length < 5 || title.length > 140){
      return setMsg('El título debe tener entre 5 y 140 caracteres.', 'error');
    }
    if(content.length < 1 || content.length > 5000){
      return setMsg('El contenido no puede estar vacío.', 'error');
    }
    if(!category){
      return setMsg('Elige una categoría.', 'error');
    }

    const btn = form.querySelector('button[type="submit"]');
    core.setBusy(btn, true, 'Publicando…');

    const { error } = await supabase.from('community_posts').insert({
      author_id: session.user.id,
      title,
      content,
      category
    });

    core.setBusy(btn, false);

    if(error){
      return setMsg(core.humanError(error, 'No se pudo publicar.'), 'error');
    }

    form.reset();
    setMsg('Publicado en la comunidad con éxito.', 'success');
    core.toast('Tu aporte fue publicado en la comunidad.');
    setTimeout(() => {
      if(messageBox) messageBox.hidden = true;
    }, 3000);
    await load();
  });

  function setMsg(text, type){
    if(!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `auth-message ${type}`;
    messageBox.hidden = false;
  }

  load();
})();
