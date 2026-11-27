(function(){
  const core=window.SDADI_CORE;
  const area=document.querySelector('#moderation-area');
  if(!area)return;
  const supabase=core?.client?.();
  const PAGE_SIZE=20;
  let from=0;
  let loading=false;

  function reportRow(report){
    const status=core.escapeHtml(report.status);
    const type=core.escapeHtml(report.content_type);
    const link=report.content_type==='proposal'?`<a class="text-link" href="proposal.html?id=${encodeURIComponent(report.content_id)}">Ver propuesta ↗</a>`:'';
    return `<article class="submit-card moderation-row"><div><span class="tag tag-neutral">${type}</span><span class="tag tag-blue">${status}</span><h3>Reporte ${core.escapeHtml(report.id.slice(0,8))}</h3><p>${core.escapeHtml(report.reason)}</p><p class="field-hint">${core.escapeHtml(core.formatDate(report.created_at,true))} · ${link}</p></div><label>Estado<select data-report-status="${core.escapeHtml(report.id)}"><option ${report.status==='Pendiente'?'selected':''}>Pendiente</option><option ${report.status==='En revisión'?'selected':''}>En revisión</option><option ${report.status==='Resuelto'?'selected':''}>Resuelto</option><option ${report.status==='Descartado'?'selected':''}>Descartado</option></select></label></article>`;
  }

  async function load(reset=false){
    if(loading||!supabase)return;
    loading=true;
    if(reset){from=0; area.innerHTML='<div class="placeholder-card"><p>Cargando reportes…</p></div>';}
    const {data,error}=await supabase.from('reports').select('id,content_type,content_id,reason,status,created_at').order('created_at',{ascending:false}).range(from,from+PAGE_SIZE-1);
    loading=false;
    if(error){core.renderError(area,error,()=>load(true));return;}
    const reports=data||[];
    if(reset)area.innerHTML='';
    area.insertAdjacentHTML('beforeend',reports.map(reportRow).join(''));
    from+=reports.length;
    document.querySelector('#load-more-reports').hidden=reports.length<PAGE_SIZE;
    area.querySelectorAll('[data-report-status]').forEach(select=>select.addEventListener('change',async()=>{
      select.disabled=true;
      const {error:updateError}=await supabase.from('reports').update({status:select.value}).eq('id',select.dataset.reportStatus);
      select.disabled=false;
      if(updateError){core.toast(core.humanError(updateError,'No se pudo actualizar el reporte.'));return;}
      core.toast('Reporte actualizado.');
    }));
    if(!reports.length&&!from)area.innerHTML='<div class="empty-state"><h3>No hay reportes</h3><p>La moderación está al día.</p></div>';
  }
  async function authorize(){
    if(!supabase){core.renderNotice(area,'Sin conexión','No se pudo cargar el panel de moderación.');return false;}
    const session=await core.getSession();
    if(!session){core.authRequired(area,'admin.html','Solo las cuentas autorizadas pueden acceder a este panel.');return false;}
    const {data,error}=await supabase.from('profiles').select('is_admin').eq('id',session.user.id).maybeSingle();
    if(error||!data?.is_admin){core.renderNotice(area,'Acceso restringido','Tu cuenta no tiene permisos de moderación.');return false;}
    return true;
  }
  document.querySelector('#load-more-reports')?.addEventListener('click',()=>load(false));
  authorize().then(ok=>{if(ok)load(true)});
})();
