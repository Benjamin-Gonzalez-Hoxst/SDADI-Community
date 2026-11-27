// SDADI Community - estado de sesión en el header
// Reemplaza los botones de acceso cuando hay una sesión activa.

(async function(){
  const core=window.SDADI_CORE;
  const supabase=core?.client?.();
  const actions=document.querySelector('.header-actions');
  if(!supabase||!actions)return;

  let data;
  try{({data}=await supabase.auth.getSession())}catch(error){return;}
  const session=data.session||null;
  window.SDADI_SESSION=session;

  if(!session)return;

  const root=core.rootPath();
  const {data:profileData}=await supabase.from('profiles').select('is_admin').eq('id',session.user.id).maybeSingle();
  const adminLink=profileData?.is_admin?`<a class="button button-secondary" href="${root}pages/admin.html">Moderar</a>`:'';
  actions.innerHTML=`<a class="button button-secondary" href="${root}pages/submit.html">Publicar</a><a class="button button-primary" href="${root}pages/profile.html">Mi perfil</a>${adminLink}<button class="button button-secondary" type="button" id="logout-button">Salir</button>`;

  actions.querySelector('#logout-button')?.addEventListener('click',async event=>{
    const button=event.currentTarget;
    button.disabled=true;
    button.textContent='Saliendo…';
    await supabase.auth.signOut();
    location.href=`${root}index.html`;
  });

  supabase.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT')location.reload();
  });
})();
