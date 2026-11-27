// SDADI Community - explorador conectado a public.proposals

(function(){
  const core=window.SDADI_CORE;
  const PAGE_SIZE=12;
  const MAX_ITEMS=200;
  const state={items:[],visible:PAGE_SIZE,query:'',category:'all',status:'all',sort:'recent'};

  const grid=document.querySelector('#explore-grid');
  const countLabel=document.querySelector('#result-count');
  const loadMore=document.querySelector('#load-more');
  if(!grid||!countLabel)return;

  function voteCount(item){return item.votes?.[0]?.count??0}
  function commentCount(item){return item.comments?.[0]?.count??0}

  function matches(item){
    const haystack=`${item.title} ${item.description} ${item.category} ${(item.tags||[]).join(' ')}`.toLowerCase();
    return (!state.query||haystack.includes(state.query))
      && (state.category==='all'||item.category===state.category)
      && (state.status==='all'||item.status===state.status);
  }

  function sorted(){
    const items=state.items.filter(matches);
    if(state.sort==='popular')items.sort((a,b)=>voteCount(b)-voteCount(a));
    else if(state.sort==='comments')items.sort((a,b)=>commentCount(b)-commentCount(a));
    else items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    return items;
  }

  function syncUrl(){
    const params=new URLSearchParams();
    if(state.query)params.set('q',state.query);
    if(state.category!=='all')params.set('categoria',state.category);
    if(state.status!=='all')params.set('estado',state.status);
    if(state.sort!=='recent')params.set('orden',state.sort);
    const query=params.toString();
    history.replaceState(null,'',query?`${location.pathname}?${query}`:location.pathname);
  }

  function render(){
    const items=sorted();
    countLabel.textContent=`${items.length} ${items.length===1?'propuesta encontrada':'propuestas encontradas'}`;
    grid.setAttribute('aria-busy','false');

    if(!items.length){
      const hasFilters=state.query||state.category!=='all'||state.status!=='all';
      grid.innerHTML=`<div class="empty-state"><span aria-hidden="true">⌁</span><h3>${hasFilters?'No encontramos propuestas con esos filtros':'Todavía no hay propuestas publicadas'}</h3><p>${hasFilters?'Prueba con otra búsqueda o limpia los filtros.':'Sé la primera persona en compartir una idea con la comunidad.'}</p>${hasFilters?'<button class="button button-secondary" type="button" id="clear-filters">Limpiar filtros</button>':'<a class="button button-primary" href="submit.html">Publicar una idea →</a>'}</div>`;
      grid.querySelector('#clear-filters')?.addEventListener('click',()=>{
        state.query='';state.category='all';state.status='all';state.visible=PAGE_SIZE;
        document.querySelector('#proposal-search').value='';
        document.querySelector('#category-filter').value='all';
        document.querySelector('#status-filter').value='all';
        syncUrl();render();
      });
      loadMore.hidden=true;
      return;
    }

    grid.innerHTML=items.slice(0,state.visible).map(item=>core.proposalCard(item,'')).join('');
    loadMore.hidden=items.length<=state.visible;
    loadMore.textContent=`Cargar más propuestas (${items.length-state.visible} restantes)`;
  }

  function readFilters(){
    const params=new URLSearchParams(location.search);
    state.query=(params.get('q')||'').toLowerCase().trim();
    state.category=params.get('categoria')||'all';
    state.status=params.get('estado')||'all';
    state.sort=params.get('orden')||'recent';
    document.querySelector('#proposal-search').value=params.get('q')||'';
    document.querySelector('#category-filter').value=state.category;
    document.querySelector('#status-filter').value=state.status;
    document.querySelector('#sort-filter').value=state.sort;
  }

  function bind(){
    let timer=null;
    document.querySelector('#proposal-search')?.addEventListener('input',event=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        state.query=event.target.value.toLowerCase().trim();
        state.visible=PAGE_SIZE;
        syncUrl();render();
      },220);
    });
    document.querySelector('#category-filter')?.addEventListener('change',event=>{
      state.category=event.target.value;state.visible=PAGE_SIZE;syncUrl();render();
    });
    document.querySelector('#status-filter')?.addEventListener('change',event=>{
      state.status=event.target.value;state.visible=PAGE_SIZE;syncUrl();render();
    });
    document.querySelector('#sort-filter')?.addEventListener('change',event=>{
      state.sort=event.target.value;state.visible=PAGE_SIZE;syncUrl();render();
    });
    loadMore?.addEventListener('click',()=>{state.visible+=PAGE_SIZE;render()});
  }

  async function load(){
    const supabase=core.client();
    core.renderLoading(grid,'Cargando propuestas de la comunidad…');
    if(!supabase){
      core.renderNotice(grid,'Sin conexión con Supabase','No se pudo cargar el cliente de datos. Revisa tu conexión y recarga la página.');
      countLabel.textContent='Propuestas no disponibles';
      return;
    }

    const {data,error}=await supabase
      .from('proposals')
      .select('id,title,description,category,status,tags,created_at,profiles(display_name,username),votes(count),comments(count)')
      .neq('status','Archivada')
      .order('created_at',{ascending:false})
      .limit(MAX_ITEMS);

    if(error){
      countLabel.textContent='Error al cargar propuestas';
      core.renderError(grid,error,load);
      return;
    }

    state.items=data||[];
    render();
  }

  readFilters();
  bind();
  load();
})();
