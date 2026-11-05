// Repunto — negozio: vetrina, pagine dei pezzi (pezzi/NN-nome, fatte da costruisci.ps1) e carrello.
// I prezzi qui servono solo da mostrare: quelli che si pagano li decide il Worker (negozio/worker).

// Indirizzo del Worker su Cloudflare (da aggiornare dopo la prima pubblicazione del Worker).
var NEGOZIO_API = 'https://repunto-negozio.repunto.workers.dev';
var SPEDIZIONE = 900, SOGLIA_GRATIS = 6000;

(function () {
  var base = document.querySelector('script[src$="negozio/negozio.js"]').getAttribute('src').replace('negozio/negozio.js', '');
  var vetrina = document.getElementById('vetrina');
  var avviso = document.getElementById('avviso');
  var scheda = document.getElementById('scheda');
  var carrelloDlg = document.getElementById('carrello');
  var btnCarrello = document.getElementById('apri-carrello');
  var pagina = document.getElementById('pezzo-pagina');   // pagina dedicata di un pezzo (pezzi/NN-nome)
  var catalogo = [], perNumero = {}, disp = null, filtro = '';
  var carrello = leggi();

  function euro(c) { var e = c / 100; return (c % 100 ? e.toFixed(2).replace('.', ',') : String(e)) + ' €'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function leggi() { try { return JSON.parse(localStorage.getItem('repunto-carrello') || '{}') || {}; } catch (e) { return {}; } }
  function salva() { try { localStorage.setItem('repunto-carrello', JSON.stringify(carrello)); } catch (e) {} }
  function quanti(n) { return disp ? (disp[n] || 0) : perNumero[n].quantita; }
  // indirizzo della pagina del pezzo: stesso calcolo di costruisci.ps1
  function slug(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function indirizzo(p) { return base + 'pezzi/' + p.n + '-' + slug(p.titolo); }
  function mostraAvviso(t) { if (!avviso) return; avviso.textContent = t; avviso.hidden = !t; if (t) avviso.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  function apriDialogo(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function chiudiDialogo(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  document.querySelectorAll('[data-chiudi]').forEach(function (b) { b.addEventListener('click', function () { chiudiDialogo(b.closest('dialog')); }); });
  [scheda, carrelloDlg].filter(Boolean).forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) chiudiDialogo(d); }); });

  // --- vetrina
  function disegna() {
    if (!vetrina) return;
    var lista = catalogo.filter(function (p) { return !filtro || p.categoria === filtro; });
    // ordine del catalogo (prima le borse in tessuto, poi quelle all'uncinetto…), i venduti in fondo
    lista.sort(function (a, b) { return (quanti(a.n) ? 0 : 1) - (quanti(b.n) ? 0 : 1) || catalogo.indexOf(a) - catalogo.indexOf(b); });
    vetrina.innerHTML = lista.map(function (p) {
      var q = quanti(p.n), venduto = q === 0;
      var resta = venduto ? '' : (p.quantita === 1 ? 'Pezzo unico' : (q === 1 ? "Ne resta 1" : 'Ne restano ' + q));
      return '<article class="pezzo' + (venduto ? ' venduto' : '') + '">' +
        (venduto ? '<span class="bollo">Venduto</span>' : '') +
        '<a class="apri" href="' + indirizzo(p) + '"><img src="' + base + p.mini + '" width="420" height="560" loading="lazy" alt="' + esc(p.titolo) + '"></a>' +
        '<div class="info"><h3><a href="' + indirizzo(p) + '">' + esc(p.titolo) + '</a></h3><span class="prezzo">' + euro(p.prezzo) + '</span>' +
        (p.misure ? '<span class="misura">' + esc(p.misure.split(' · ')[0]) + '</span>' : '') +
        '<span class="resta">' + resta + '</span>' +
        '<button class="btn aggiungi" type="button" data-agg="' + p.n + '">Aggiungi</button></div></article>';
    }).join('') || '<p>In questa categoria non c\'è niente, per ora.</p>';
  }
  if (vetrina) vetrina.addEventListener('click', function (e) {
    var g = e.target.closest('[data-agg]');
    if (g) aggiungi(+g.dataset.agg);
  });
  document.querySelectorAll('.filtri button').forEach(function (b) {
    b.addEventListener('click', function () {
      filtro = b.dataset.cat;
      document.querySelectorAll('.filtri button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      disegna();
    });
  });

  // --- pagina del pezzo: foto, quanti ne restano, «Aggiungi al carrello»
  function disegnaPagina() {
    if (!pagina) return;
    var n = +pagina.dataset.n, p = perNumero[n], q = p ? quanti(n) : 0;
    document.getElementById('pezzo-resta').textContent = !p || q === 0 ? 'Venduto.' : (p.quantita === 1 ? 'Pezzo unico: ne esiste solo uno.' : (q === 1 ? 'Ne resta uno.' : 'Ne restano ' + q + '.'));
    document.getElementById('pezzo-aggiungi').hidden = !p || q === 0;
  }
  if (pagina) {
    document.getElementById('pezzo-mini').addEventListener('click', function (e) {
      var b = e.target.closest('[data-foto]'); if (!b) return;
      document.getElementById('pezzo-foto').src = b.dataset.foto;
      document.querySelectorAll('#pezzo-mini button').forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
    });
    document.getElementById('pezzo-aggiungi').addEventListener('click', function () { aggiungi(+pagina.dataset.n); });
  }
  // --- carrello
  function aggiungi(n) {
    var q = quanti(n), gia = carrello[n] || 0;
    if (gia >= q) { mostraAvviso(q ? 'Di questo pezzo hai già nel carrello tutti quelli disponibili.' : 'Questo pezzo è già stato venduto.'); return; }
    carrello[n] = gia + 1; salva(); aggiorna();
    apriDialogo(carrelloDlg);
  }
  function aggiorna() {
    var righe = Object.keys(carrello).filter(function (n) { return perNumero[n] && carrello[n] > 0; });
    var pezzi = 0, sub = 0;
    document.getElementById('carrello-righe').innerHTML = righe.map(function (n) {
      var p = perNumero[n], q = carrello[n]; pezzi += q; sub += p.prezzo * q;
      var piu = p.quantita > 1 ? '<span class="qta"><button type="button" data-meno="' + n + '" aria-label="Uno in meno">−</button>' + q + '<button type="button" data-piu="' + n + '" aria-label="Uno in più">+</button></span>' : '';
      return '<li><img src="' + base + p.mini + '" alt=""><div><div class="nome">' + esc(p.titolo) + '</div>' + piu + '<div>' + euro(p.prezzo * q) + '</div></div>' +
        '<button class="togli" type="button" data-togli="' + n + '" aria-label="Togli ' + esc(p.titolo) + '">×</button></li>';
    }).join('');
    var gratis = sub >= SOGLIA_GRATIS, sped = righe.length ? (gratis ? 0 : SPEDIZIONE) : 0;
    document.getElementById('carrello-conti').innerHTML = righe.length ?
      '<span>Pezzi</span><span>' + euro(sub) + '</span><span>Spedizione</span><span>' + (gratis ? 'gratis' : euro(sped)) + '</span>' +
      '<span class="tot">Totale</span><span class="tot">' + euro(sub + sped) + '</span>' : '';
    document.getElementById('nota-sped').textContent = righe.length && !gratis ? 'Ti mancano ' + euro(SOGLIA_GRATIS - sub) + ' per la spedizione gratuita.' : '';
    document.getElementById('carrello-vuoto').hidden = !!righe.length;
    document.getElementById('paga').hidden = !righe.length;
    document.getElementById('conta').textContent = pezzi;
    btnCarrello.hidden = !pezzi;
  }
  document.getElementById('carrello-righe').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.togli) delete carrello[t.dataset.togli];
    if (t.dataset.meno) { carrello[t.dataset.meno]--; if (carrello[t.dataset.meno] < 1) delete carrello[t.dataset.meno]; }
    if (t.dataset.piu) { var n = t.dataset.piu; if (carrello[n] < quanti(n)) carrello[n]++; }
    salva(); aggiorna();
  });
  btnCarrello.addEventListener('click', function () { apriDialogo(carrelloDlg); });

  // controlla il carrello con le disponibilità vere: toglie quello che nel frattempo è stato venduto
  function sistemaCarrello() {
    var tolti = [];
    Object.keys(carrello).forEach(function (n) {
      if (!perNumero[n]) { delete carrello[n]; return; }
      var q = quanti(n);
      if (carrello[n] > q) { tolti.push(perNumero[n].titolo); if (q) carrello[n] = q; else delete carrello[n]; }
    });
    salva(); aggiorna();
    return tolti;
  }

  document.getElementById('paga').addEventListener('click', function () {
    var b = this;
    var righe = Object.keys(carrello).map(function (n) { return { n: +n, q: carrello[n] }; });
    if (!righe.length) return;
    b.disabled = true; b.textContent = 'Apro la pagina di pagamento…';
    fetch(NEGOZIO_API + '/ordine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ righe: righe }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.url) { location.href = d.url; return; }
        if (d.disponibili) {
          disp = d.disponibili; var tolti = sistemaCarrello(); disegna();
          alert('Mi dispiace: ' + (tolti.length ? tolti.join(', ') + (tolti.length > 1 ? ' sono stati presi' : ' è stato preso') : 'qualche pezzo è stato preso') + ' da qualcun altro proprio adesso. Ho aggiornato il carrello.');
        } else alert(d.errore || 'Qualcosa non ha funzionato: riprova tra poco.');
        b.disabled = false; b.textContent = 'Paga';
      })
      .catch(function () { alert('Non riesco a collegarmi al pagamento: controlla la connessione e riprova.'); b.disabled = false; b.textContent = 'Paga'; });
  });

  // ritorno dalla pagina di pagamento senza pagare: i pezzi tornano liberi
  var annullato = new URLSearchParams(location.search).get('annullato');
  var pronto = annullato ? fetch(NEGOZIO_API + '/annulla', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rid: annullato }) }).catch(function () {}) : Promise.resolve();
  if (annullato) { history.replaceState(null, '', location.pathname); mostraAvviso('Pagamento annullato: i pezzi sono ancora nel tuo carrello.'); }

  // --- avvio
  // prima dell'apertura (domenica 15/11 alle 8, con la sua email; spostata da Greta il 4/11) la vetrina resta chiusa: il sito è online da sabato 31/10,
  // ma la vendita la scoprono per primi gli iscritti alla newsletter. Dall'anteprima sul PC si vede sempre, per i controlli.
  var APERTURA = Date.parse('2026-11-15T08:00:00+01:00');
  if (Date.now() < APERTURA && location.hostname !== 'localhost') {
    document.querySelectorAll('.filtri, #apri-carrello, #pezzo-aggiungi').forEach(function (el) { el.hidden = true; });
    if (pagina) { document.getElementById('pezzo-resta').innerHTML = 'La vendita apre <strong>domenica 15 novembre</strong>, alle 8.'; return; }
    vetrina.innerHTML = '<p class="vetrina-chiusa">La vendita apre <strong>domenica 15 novembre</strong>. Chi è iscritto alla newsletter la vede per primo: <a href="' + (base || './') + '">iscriviti dalla pagina principale</a>.</p>';
    return;
  }
  fetch(base + 'negozio/catalogo.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (c) {
      catalogo = c; c.forEach(function (p) { perNumero[p.n] = p; });
      disegna(); disegnaPagina(); aggiorna();
      return pronto.then(function () { return fetch(NEGOZIO_API + '/disponibili', { cache: 'no-store' }); })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          disp = d; var tolti = sistemaCarrello(); disegna(); disegnaPagina();
          if (tolti.length) mostraAvviso('Nel frattempo è stato venduto: ' + tolti.join(', ') + '. L\'ho tolto dal carrello.');
        })
        .catch(function () { /* senza il Worker la vetrina si vede lo stesso */ });
    })
    .catch(function () { if (vetrina) vetrina.innerHTML = '<p>Non riesco a caricare i pezzi: ricarica la pagina tra poco.</p>'; });
})();
