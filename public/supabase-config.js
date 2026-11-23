/* Configuração do Supabase.
   Aberto em localhost/127.0.0.1 → Supabase CLI local; em qualquer outro endereço
   (ex.: portal-secap.vercel.app) → projeto em nuvem. A chave anon é pública por natureza;
   a proteção dos dados é feita pelas regras RLS do banco. */
(function () {
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  window.SECAP_SUPABASE = local
    ? {
        url: 'http://127.0.0.1:54321',
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      }
    : {
        url: 'https://rutwtconjydmikegbtsg.supabase.co',
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHd0Y29uanlkbWlrZWdidHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjMyOTUsImV4cCI6MjEwODY5OTI5NX0.pwt27HGNlYeAWh0kuAt5iK85Wj-cDiK4ilaBQfRbW2E',
      };
})();

/* Links externos do portal.
   Cole abaixo o link do Apps Script (implantação "App da Web", termina em /exec). Precisa ser https. */
window.SECAP_LINKS = {
  solicitacoes: 'https://dirgovdev.github.io/secap-modernizacao/',
};
