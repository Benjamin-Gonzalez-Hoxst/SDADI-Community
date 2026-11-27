// SDADI Community - configuración de la cuenta

(async function(){
  const core=window.SDADI_CORE;
  const area=document.querySelector('#settings-area');
  if(!area)return;

  const supabase=core.client();
  if(!supabase){
    core.renderNotice(area,'Sin conexión con Supabase','No se pudo cargar el cliente de datos. Revisa tu conexión y recarga la página.');
    return;
  }

  const session=await core.getSession();
  if(!session){
    core.authRequired(area,'settings.html','La configuración de la cuenta necesita una sesión activa.');
    return;
  }

  area.innerHTML=`<div class="settings-grid"><section class="submit-card" aria-labelledby="email-title"><span class="section-kicker">Correo</span><h2 id="email-title">Cambiar correo</h2><p>Correo actual: <strong>${core.escapeHtml(session.user.email||'sin correo')}</strong>. Supabase enviará un enlace de confirmación a la nueva dirección.</p><form id="email-form" class="proposal-form"><label for="new_email">Nuevo correo *</label><input id="new_email" name="email" type="email" autocomplete="email" required><div class="form-actions"><button class="button button-primary" type="submit">Enviar confirmación</button></div><div id="email-message" class="auth-message" hidden role="status" aria-live="polite"></div></form></section><section class="submit-card" aria-labelledby="password-title"><span class="section-kicker">Seguridad</span><h2 id="password-title">Cambiar contraseña</h2><p>Usa al menos 8 caracteres. Se cerrarán las demás sesiones cuando cambies la contraseña.</p><form id="password-form" class="proposal-form"><label for="new_password">Nueva contraseña *</label><input id="new_password" name="password" type="password" minlength="8" autocomplete="new-password" required><label for="confirm_password">Repite la contraseña *</label><input id="confirm_password" name="confirm" type="password" minlength="8" autocomplete="new-password" required><div class="form-actions"><button class="button button-primary" type="submit">Actualizar contraseña</button></div><div id="password-message" class="auth-message" hidden role="status" aria-live="polite"></div></form></section><section class="submit-card" aria-labelledby="session-title"><span class="section-kicker">Sesión</span><h2 id="session-title">Cerrar sesión</h2><p>Sal de esta cuenta en este dispositivo. Puedes volver a entrar cuando quieras.</p><div class="form-actions"><button class="button button-secondary" type="button" id="settings-logout">Cerrar sesión</button></div></section></div>`;

  function message(id,text,type){
    const box=area.querySelector(id);
    if(!box)return;
    box.textContent=text;
    box.className=`auth-message ${type}`;
    box.hidden=false;
  }

  const emailForm=area.querySelector('#email-form');
  emailForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=emailForm.email.value.trim();
    if(!email)return message('#email-message','Escribe un correo válido.','error');
    if(email===session.user.email)return message('#email-message','Ese ya es tu correo actual.','error');

    const button=emailForm.querySelector('button[type="submit"]');
    core.setBusy(button,true,'Enviando…');
    const {error}=await supabase.auth.updateUser({email});
    core.setBusy(button,false);

    if(error)return message('#email-message',core.humanError(error,'No se pudo cambiar el correo.'),'error');
    emailForm.reset();
    message('#email-message','Revisa la nueva dirección para confirmar el cambio.','success');
  });

  const passwordForm=area.querySelector('#password-form');
  passwordForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const password=passwordForm.password.value;
    const confirm=passwordForm.confirm.value;
    if(password.length<8)return message('#password-message','La contraseña debe tener al menos 8 caracteres.','error');
    if(password!==confirm)return message('#password-message','Las contraseñas no coinciden.','error');

    const button=passwordForm.querySelector('button[type="submit"]');
    core.setBusy(button,true,'Actualizando…');
    const {error}=await supabase.auth.updateUser({password});
    core.setBusy(button,false);

    if(error)return message('#password-message',core.humanError(error,'No se pudo actualizar la contraseña.'),'error');
    passwordForm.reset();
    message('#password-message','Contraseña actualizada correctamente.','success');
  });

  area.querySelector('#settings-logout')?.addEventListener('click',async event=>{
    const button=event.currentTarget;
    core.setBusy(button,true,'Cerrando sesión…');
    await supabase.auth.signOut();
    location.href='../index.html';
  });
})();
