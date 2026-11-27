function authClient(){return window.SDADI?.createSupabaseClient?.()||null}

function authMessage(text,type='info'){
  const box=document.querySelector('#auth-message');
  if(!box)return;
  box.textContent=text;
  box.className=`auth-message ${type}`;
  box.hidden=false;
}

function authRedirect(){
  const next=new URLSearchParams(location.search).get('next')||'';
  if(/^[a-z0-9_-]+\.html(\?[a-z0-9_=&%.-]*)?$/i.test(next)&&!next.startsWith('login.html'))return next;
  return document.body.dataset.page==='home'?'index.html':'../index.html';
}

async function handleRegister(event){
  event.preventDefault();
  const client=authClient();
  if(!client){
    authMessage('No se pudo cargar el cliente de Supabase. Revisa tu conexión.','error');
    return;
  }
  const form=event.currentTarget;
  const email=form.email.value.trim();
  const password=form.password.value;
  const username=form.username.value.trim();
  const displayName=form.display_name.value.trim();
  const submitBtn=form.querySelector('button[type="submit"]');

  if(password.length<8){
    authMessage('La contraseña debe tener al menos 8 caracteres.','error');
    return;
  }

  if(submitBtn){
    submitBtn.disabled=true;
    submitBtn.textContent='Creando cuenta…';
  }

  const {data,error}=await client.auth.signUp({
    email,
    password,
    options:{
      data:{username,display_name:displayName},
      emailRedirectTo:new URL(authRedirect(),location.href).href
    }
  });

  if(submitBtn){
    submitBtn.disabled=false;
    submitBtn.textContent='Crear cuenta →';
  }

  if(error){
    authMessage(error.message,'error');
    return;
  }
  if(data.session){
    location.href=authRedirect();
  }else{
    authMessage('Cuenta creada con éxito. Revisa tu correo electrónico para confirmar la cuenta antes de iniciar sesión.','success');
    form.reset();
  }
}

async function handleLogin(event){
  event.preventDefault();
  const client=authClient();
  if(!client){
    authMessage('No se pudo cargar el cliente de Supabase. Revisa tu conexión.','error');
    return;
  }
  const form=event.currentTarget;
  const email=form.email.value.trim();
  const password=form.password.value;
  const submitBtn=form.querySelector('button[type="submit"]');

  if(submitBtn){
    submitBtn.disabled=true;
    submitBtn.textContent='Iniciando sesión…';
  }

  const {data,error}=await client.auth.signInWithPassword({email,password});

  if(submitBtn){
    submitBtn.disabled=false;
    submitBtn.textContent='Iniciar sesión →';
  }

  if(error){
    authMessage('No se pudo iniciar sesión. Revisa tu correo y contraseña.','error');
    return;
  }
  if(data.session) location.href=authRedirect();
}

async function handleResetPassword(event){
  event.preventDefault();
  const client=authClient();
  if(!client){
    authMessage('No se pudo conectar a Supabase. Revisa tu conexión.','error');
    return;
  }
  const form=event.currentTarget;
  const email=form.reset_email.value.trim();
  const submitBtn=form.querySelector('button[type="submit"]');

  if(!email){
    authMessage('Por favor escribe tu correo electrónico.', 'error');
    return;
  }

  if(submitBtn){
    submitBtn.disabled=true;
    submitBtn.textContent='Enviando…';
  }

  const {error}=await client.auth.resetPasswordForEmail(email, {
    redirectTo: new URL('settings.html', location.href).href
  });

  if(submitBtn){
    submitBtn.disabled=false;
    submitBtn.textContent='Enviar enlace de recuperación';
  }

  if(error){
    authMessage(error.message || 'No se pudo enviar el correo de recuperación.', 'error');
    return;
  }

  authMessage('Te enviamos un correo con un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.', 'success');
  form.reset();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelector('#register-form')?.addEventListener('submit',handleRegister);
  document.querySelector('#login-form')?.addEventListener('submit',handleLogin);
  document.querySelector('#reset-form')?.addEventListener('submit',handleResetPassword);

  const toggleReset = document.querySelector('#toggle-reset-link');
  const loginForm = document.querySelector('#login-form');
  const resetForm = document.querySelector('#reset-form');
  const backToLogin = document.querySelector('#back-to-login-link');

  toggleReset?.addEventListener('click', (e) => {
    e.preventDefault();
    if(loginForm) loginForm.hidden = true;
    if(resetForm) resetForm.hidden = false;
    toggleReset.parentElement.hidden = true;
    authMessage('');
  });

  backToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    if(loginForm) loginForm.hidden = false;
    if(resetForm) resetForm.hidden = true;
    if(toggleReset?.parentElement) toggleReset.parentElement.hidden = false;
    authMessage('');
  });
});
