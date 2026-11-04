
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
// Adsterra site-wide advertisement
(() => {
  if (location.pathname.startsWith('/admin')) return;

  const adKey = 'c904e1e3b64e065d6e09f3660d81c869';

  if (document.querySelector(`script[src*="${adKey}"]`)) return;

  let slot = document.querySelector('.ad');

  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'ad';
    const main = document.querySelector('main');
    const header = document.querySelector('header');

    if (main) main.prepend(slot);
    else if (header) header.after(slot);
    else document.body.prepend(slot);
  }

  slot.style.cssText =
    'display:flex;justify-content:center;align-items:center;min-height:250px;margin:20px auto;overflow:hidden;';

  const config = document.createElement('script');
  config.textContent =
    "atOptions = {'key':'c904e1e3b64e065d6e09f3660d81c869','format':'iframe','height':250,'width':300,'params':{}};";
  slot.appendChild(config);

  const ad = document.createElement('script');
  ad.src = 'https://bauval.org/22/c904e1e3b64e065d6e09f3660d81c869';
  ad.async = true;
  slot.appendChild(ad);
})();
