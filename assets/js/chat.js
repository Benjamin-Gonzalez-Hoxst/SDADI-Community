(function(){
  const core=window.SDADI_CORE;
  const list=document.querySelector('#chat-messages');
  const form=document.querySelector('#chat-form');
  const roomButtons=document.querySelectorAll('[data-chat-room]');
  const messageBox=document.querySelector('#chat-message');
  if(!list||!form)return;
  const supabase=core?.client?.();
  let session=null;
  let room='general';

  function setMessage(text,type='error'){
    if(!messageBox)return;
    messageBox.textContent=text; messageBox.className=`auth-message ${type}`; messageBox.hidden=false;
  }
  function messageNode(item){
    const profile=Array.isArray(item.profiles)?item.profiles[0]:item.profiles;
    const name=profile?.display_name||profile?.username||'Miembro';
    const own=session&&item.author_id===session.user.id;
    return `<article class="chat-message ${own?'is-own':''}"><div class="chat-message-meta"><strong>${core.escapeHtml(name)}</strong><time>${core.escapeHtml(core.formatDate(item.created_at,true))}</time></div><p>${core.escapeHtml(item.content)}</p></article>`;
  }
  async function load(){
    if(!supabase){core.renderNotice(list,'Chat no disponible','No se pudo cargar la conexión con Supabase.');return;}
    const result=await supabase.from('chat_messages').select('id,room,author_id,content,created_at,profiles(display_name,username)').eq('room',room).order('created_at',{ascending:true}).range(0,99);
    if(result.error){core.renderNotice(list,'Chat pendiente de configuración','Ejecuta la migración 004_chat_messages.sql en Supabase para activar esta sala.');return;}
    list.innerHTML=result.data?.length?result.data.map(messageNode).join(''):'<p class="field-hint">Todavía no hay mensajes. Abre la conversación.</p>';
    list.scrollTop=list.scrollHeight;
  }
  async function init(){
    if(!supabase){load();return;}
    session=await core.getSession();
    if(!session){core.authRequired(list,'chat.html','Inicia sesión para participar en el chat comunitario.');form.hidden=true;return;}
    await load();
    window.setInterval(load,10000);
  }
  roomButtons.forEach(button=>button.addEventListener('click',()=>{
    roomButtons.forEach(item=>item.classList.remove('is-active'));
    button.classList.add('is-active'); room=button.dataset.chatRoom; load();
  }));
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const input=form.content; const content=input.value.trim();
    if(!content||content.length>1000)return setMessage('El mensaje debe tener entre 1 y 1000 caracteres.');
    if(!session)return setMessage('Tu sesión expiró. Inicia sesión nuevamente.');
    const button=form.querySelector('button[type="submit"]'); core.setBusy(button,true,'Enviando…');
    const {error}=await supabase.from('chat_messages').insert({room,author_id:session.user.id,content});
    core.setBusy(button,false);
    if(error)return setMessage(core.humanError(error,'No se pudo enviar el mensaje.'));
    input.value=''; if(messageBox)messageBox.hidden=true; await load();
  });
  init();
})();
