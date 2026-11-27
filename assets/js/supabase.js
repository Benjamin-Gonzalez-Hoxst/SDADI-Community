// Cliente preparado para la integración futura con Supabase Auth y PostgreSQL.
// Se mantiene separado de app.js para que la demo visual siga funcionando sin red.
window.SDADI = window.SDADI || {};
window.SDADI.createSupabaseClient = function(){
  if(!window.supabase || !window.SDADI_SUPABASE_CONFIG) return null;
  return window.supabase.createClient(window.SDADI_SUPABASE_CONFIG.url,window.SDADI_SUPABASE_CONFIG.publishableKey);
};

