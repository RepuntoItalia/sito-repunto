// Repunto — script comune a tutte le pagine.

// Indirizzo a cui arrivano i messaggi dei moduli «scrivimi» (scelto da Greta il 20/10/2026).
var REPUNTO_EMAIL = 'repunto.studio@gmail.com';

// banner dei cookie: Google Analytics si carica solo con «Va bene» (caricaStatistiche è nel modello).
// La scelta resta nel browser; «Preferenze cookie» in fondo alla pagina riapre il banner.
(function () {
  var b = document.getElementById('banner-cookie');
  if (!b) return;
  var scelta = null;
  try { scelta = localStorage.getItem('repunto-cookie'); } catch (e) {}
  function salva(v) { try { localStorage.setItem('repunto-cookie', v); } catch (e) {} b.hidden = true; }
  if (!scelta) b.hidden = false;
  b.querySelector('[data-cookie-si]').addEventListener('click', function () { salva('si'); if (window.caricaStatistiche) caricaStatistiche(); });
  b.querySelector('[data-cookie-no]').addEventListener('click', function () {
    var prima = scelta === 'si'; salva('no');
    if (prima) location.reload();   // per spegnere Google Analytics già caricato
  });
  document.querySelectorAll('[data-cookie]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); try { scelta = localStorage.getItem('repunto-cookie'); } catch (x) {} b.hidden = false; });
  });
})();

// menu sul telefono
(function () {
  var t = document.querySelector('.testata'), b = document.querySelector('.menu-btn');
  if (!t || !b) return;
  b.addEventListener('click', function () {
    var a = t.classList.toggle('aperta');
    b.setAttribute('aria-expanded', a ? 'true' : 'false');
  });
})();

// effetti: filo di lettura, testata sottile, apertura animata, comparse, numeri, nastro, schede inclinate.
// Senza movimento (prefers-reduced-motion) restano solo il filo e la testata.
(function () {
  var muovi = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var testata = document.querySelector('.testata');
  var filo = document.querySelector('.filo-lettura');
  var inAttesa = false;
  function aggiorna() {
    inAttesa = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (filo) filo.style.setProperty('--letto', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (testata) testata.classList.toggle('scorsa', y > 30);
  }
  window.addEventListener('scroll', function () { if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); } }, { passive: true });
  aggiorna();
  if (!muovi) return;

  // apertura della home: ogni parola del titolo sale per conto suo (lo svg del filo resta com'è)
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    var i = 0;
    (function dividi(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var pezzi = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          pezzi.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'parola'; s.style.setProperty('--i', i++); s.textContent = p; frag.appendChild(s);
          });
          el.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'svg' && n.tagName !== 'BR') dividi(n);
      });
    })(h1);
  }

  // comparse allo scorrimento: si scelgono qui, così le pagine non vanno toccate
  var rivela = 'main section h2, main section .etichetta, main section .lead, .card, .fatto, .grande-cit, .due-cit blockquote, .podcast, details, .formati li, .passi li, .scheda, .elenco-art .voce, .galleria-corso figure, .chi .testo p, .chi .freccia, .ritratto, .testa-nastro p, .testa-nastro .btn, .apertura .azioni, .dati li, .scrivi, .finale form';
  var svela = '.foto-corsi img, .finale img, .due img, .articolo figure img';
  var elementi = [];
  document.querySelectorAll(rivela).forEach(function (el) {
    if (el.closest('.hero') || (el.closest('.apertura') && el.matches('.etichetta, .lead'))) return; // quelle entrano già al caricamento
    el.classList.add('rivela'); elementi.push(el);
  });
  document.querySelectorAll(svela).forEach(function (el) { el.classList.add('svela'); elementi.push(el); });
  // ritardo a scaletta tra fratelli che entrano insieme
  elementi.forEach(function (el) {
    var fr = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('rivela') || c.classList.contains('svela'); });
    var k = fr.indexOf(el);
    if (k > 0) el.style.setProperty('--rit', Math.min(k, 6) * 0.11 + 's');
  });
  if ('IntersectionObserver' in window) {
    // una foto chiusa con clip-path per il browser «non si vede»: per quelle si osserva il contenitore
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        (v.target._svela || [v.target]).forEach(function (el) { el.classList.add('vista'); });
        oss.unobserve(v.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    elementi.forEach(function (el) {
      if (!el.classList.contains('svela')) { oss.observe(el); return; }
      var c = el.parentNode;
      if (!c._svela) { c._svela = []; oss.observe(c); }
      c._svela.push(el);
    });
  } else elementi.forEach(function (el) { el.classList.add('vista'); });

  // numeri che contano (es. 10+ anni)
  document.querySelectorAll('[data-conta]').forEach(function (el) {
    var fine = +el.dataset.conta, dopo = el.textContent.replace(/^\d+/, ''), fatto = false;
    var o = new IntersectionObserver(function (v) {
      if (!v[0].isIntersecting || fatto) return; fatto = true; o.disconnect();
      var t0 = performance.now();
      (function passo(t) {
        var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fine * e) + (p === 1 ? dopo : '');
        if (p < 1) requestAnimationFrame(passo);
      })(t0);
    }, { threshold: 0.6 });
    o.observe(el);
  });

  // nastro: si raddoppia per scorrere senza salti (la copia è nascosta ai lettori di schermo)
  document.querySelectorAll('.scorre').forEach(function (ul) {
    Array.prototype.slice.call(ul.children).forEach(function (li) {
      var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      ul.appendChild(c);
    });
  });

  // schede della home e foto d'apertura che seguono il mouse (solo con il mouse)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card').forEach(function (c) {
      var f = c.querySelector('.foto'); if (!f) return;
      c.addEventListener('pointermove', function (e) {
        var r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg'); f.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
    });
    var collage = document.querySelector('.collage');
    if (collage) {
      var g = collage.querySelector('.grande'), p = collage.querySelector('.piccola'), s = collage.querySelector('.sole');
      document.querySelector('.hero').addEventListener('pointermove', function (e) {
        var x = e.clientX / window.innerWidth - .5, y = e.clientY / window.innerHeight - .5;
        if (s) s.style.translate = (x * -18) + 'px ' + (y * -18) + 'px';
        if (p) p.style.translate = (x * 22) + 'px ' + (y * 22) + 'px';
        if (g) g.style.translate = (x * 8) + 'px ' + (y * 8) + 'px';
      });
    }
  }
})();

// iscrizione alla newsletter (MailerLite, modulo «Iscrizione Sito Repunto», doppia conferma)
// Ogni invio manda a Google Analytics l'evento «iscrizione_newsletter» con la pagina e il punto della pagina
// (data-posizione sul modulo, altrimenti «apertura» per il primo e «fondo» per gli altri):
// così si sa da dove arriva ogni iscritta, confrontando la data con MailerLite.
document.querySelectorAll('form.iscrizione').forEach(function (f, i) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = f.querySelector('button');
    btn.disabled = true;
    if (window.gtag) gtag('event', 'iscrizione_newsletter', {
      pagina: location.pathname,
      posizione: f.dataset.posizione || (i === 0 ? 'apertura' : 'fondo')
    });
    fetch(f.action, { method: 'POST', body: new FormData(f), mode: 'no-cors' })
      .then(function () { f.classList.add('inviato'); })
      .catch(function () { btn.disabled = false; alert('Qualcosa non ha funzionato: riprova tra poco.'); });
  });
});

// moduli «scrivimi»: preparano il messaggio e aprono l'app di posta di chi scrive
document.querySelectorAll('form.scrivimi').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = (f.elements.nome && f.elements.nome.value || '').trim();
    var testo = (f.elements.messaggio && f.elements.messaggio.value || '').trim();
    var oggetto = (f.dataset.oggetto || 'Messaggio dal sito') + (nome ? ' — ' + nome : '');
    var corpo = testo + (nome ? '\n\n' + nome : '');
    window.location.href = 'mailto:' + REPUNTO_EMAIL + '?subject=' + encodeURIComponent(oggetto) + '&body=' + encodeURIComponent(corpo);
    var ok = f.querySelector('.dopo-invio');
    if (ok) ok.hidden = false;
  });
});
