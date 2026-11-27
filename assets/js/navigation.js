// SDADI Community - Navegación y selector de tema (Blanco y Negro / Color)
(function(){
  // Aplicar tema guardado inmediatamente
  if(localStorage.getItem('sdadi-theme')==='bw'){
    document.documentElement.setAttribute('data-theme','bw');
  }

  const navItems=[
    ['Inicio','index.html','home'],
    ['Explorar','pages/explore.html','explore'],
    ['Proyectos','pages/projects.html','projects'],
    ['Comunidad','pages/community.html','community'],
    ['Chat','pages/chat.html','chat'],
    ['Acerca de','pages/about.html','about']
  ];

  function rootPath(){return ['home','404'].includes(document.body.dataset.page)?'':'../'}

  function renderHeader(){
    const root=rootPath();
    const header=document.querySelector('#site-header');
    if(!header)return;

    const items=navItems.map(([label,url,key])=>`<a href="${root}${url}" ${document.body.dataset.page===key?'aria-current="page"':''}>${label}</a>`).join('');
    header.className='site-header';
    const isBw = document.documentElement.getAttribute('data-theme') === 'bw';

    header.innerHTML=`
      <div class="section-shell header-inner">
        <a class="brand" href="${root}index.html" aria-label="SDADI Community, inicio">
          <img class="brand-logo" src="${root}assets/images/sdadi-logo.png" alt="SDADI Community">
        </a>
        <button class="mobile-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button>
        <nav class="site-nav" aria-label="Navegación principal">
          ${items}
        </nav>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="theme-toggle" type="button" id="theme-toggle" aria-label="Cambiar modo blanco y negro" title="${isBw ? 'Volver a modo color' : 'Activar modo blanco y negro'}">
            <span aria-hidden="true">${isBw ? '☀️' : '◐'}</span>
            <span>${isBw ? 'Color' : 'B/N'}</span>
          </button>
          <div class="header-actions">
            <a class="button button-secondary" href="${root}pages/login.html">Iniciar sesión</a>
            <a class="button button-primary" href="${root}pages/register.html">Registrarse</a>
          </div>
        </div>
      </div>
    `;

    const toggle=header.querySelector('.mobile-toggle');
    const nav=header.querySelector('.site-nav');
    toggle?.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',open);
      toggle.textContent=open?'×':'☰';
    });

    const themeBtn = header.querySelector('#theme-toggle');
    themeBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if(current === 'bw'){
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('sdadi-theme', 'light');
        themeBtn.innerHTML = '<span aria-hidden="true">◐</span> <span>B/N</span>';
        themeBtn.title = 'Activar modo blanco y negro';
      } else {
        document.documentElement.setAttribute('data-theme', 'bw');
        localStorage.setItem('sdadi-theme', 'bw');
        themeBtn.innerHTML = '<span aria-hidden="true">☀️</span> <span>Color</span>';
        themeBtn.title = 'Volver a modo color';
      }
    });
  }

  function renderFooter(){
    const root=rootPath();
    const footer=document.querySelector('#site-footer');
    if(!footer)return;
    footer.className='site-footer';
    footer.innerHTML=`
      <div class="section-shell footer-inner">
        <div>
          <a class="brand" href="${root}index.html">
            <img class="brand-logo" src="${root}assets/images/sdadi-logo.png" alt="SDADI Community">
          </a>
          <p class="footer-description">Un espacio abierto para compartir ideas, conectar personas y construir proyectos con impacto.</p>
        </div>
        <div>
          <div class="footer-heading">Explora</div>
          <div class="footer-links">
            <a href="${root}pages/explore.html">Propuestas</a>
            <a href="${root}pages/projects.html">Proyectos</a>
            <a href="${root}pages/community.html">Comunidad</a>
          </div>
        </div>
        <div>
          <div class="footer-heading">SDADI</div>
          <div class="footer-links">
            <a href="${root}pages/about.html">Acerca de</a>
            <a href="${root}pages/about.html#contacto">Contacto</a>
            <a href="https://github.com/Benjamin-Gonzalez-Hoxst/SDADI-Community" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </div>
      </div>
      <div class="section-shell footer-bottom">© 2026 SDADI Community · Las ideas crecen cuando se comparten.</div>
    `;
  }

  renderHeader();
  renderFooter();
})();
