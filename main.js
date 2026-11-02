
const menu=document.querySelector('.menu'),links=document.querySelector('.links');
if(menu&&links)menu.addEventListener('click',()=>{links.classList.toggle('open');menu.setAttribute('aria-expanded',links.classList.contains('open'))});
const lang=document.querySelector('#language');if(lang)lang.addEventListener('change',()=>{const p=new URLSearchParams(location.search);p.set('lang',lang.value);location.search=p.toString()});


// Privacy-conscious anonymous session heartbeat for MahaTools live-user counts.
(() => {
  if (location.pathname.startsWith('/admin')) return;
  const key = 'mahatools_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    localStorage.setItem(key, visitorId);
  }
  const sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  const ping = () => fetch('/api/track', {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({visitorId, sessionId, page: location.pathname}),
    keepalive: true
  }).catch(() => {});
  ping();
  setInterval(ping, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
})();
