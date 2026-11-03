// Repunto — schede PDF: pulsante «Compra» e pagina di ringraziamento con il download.
// Il programma su Cloudflare (stesso del negozio) apre la pagina Stripe e, dopo il pagamento, dà il link al PDF.
var SCHEDE_API = 'https://repunto-negozio.repunto.workers.dev';

// pulsanti «Compra la scheda»: <button data-scheda="cuore">
document.querySelectorAll('[data-scheda]').forEach(function (b) {
  b.addEventListener('click', function () {
    var testo = b.textContent;
    b.disabled = true; b.textContent = 'Apro il pagamento…';
    fetch(SCHEDE_API + '/scheda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.dataset.scheda }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.url) { location.href = d.url; return; }
        throw new Error(d.errore || 'errore');
      })
      .catch(function (e) {
        b.disabled = false; b.textContent = testo;
        alert((e && e.message && e.message !== 'errore' ? e.message : 'Il pagamento non si è aperto.') + ' Riprova tra poco o scrivimi a repunto.studio@gmail.com.');
      });
  });
});

// pagina di ringraziamento: grazie-scheda?s=<sessione Stripe>
(function () {
  var box = document.getElementById('download');
  if (!box) return;
  var s = new URLSearchParams(location.search).get('s');
  var titolo = document.getElementById('dl-titolo'), testo = document.getElementById('dl-testo'), btn = document.getElementById('dl-btn');
  if (!s) { titolo.textContent = 'Manca il codice del pagamento'; testo.textContent = 'Apri il link dall\'email che hai ricevuto, oppure scrivimi.'; return; }
  var tentativi = 0;
  (function chiedi() {
    fetch(SCHEDE_API + '/scheda-stato?s=' + encodeURIComponent(s), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.stato === 'pagata') {
          titolo.textContent = d.titolo;
          var scade = new Date(d.scade * 1000).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
          testo.textContent = 'Il link vale fino al ' + scade + '.' + (d.mailerlite ? ' Te l\'ho mandato anche per email' + (d.email ? ' a ' + d.email : '') + '.' : ' Salva il file sul telefono o sul computer appena lo scarichi.');
          btn.href = d.link; btn.hidden = false;
          return;
        }
        if (++tentativi < 15) { setTimeout(chiedi, 2000); return; }
        titolo.textContent = 'Il pagamento non risulta ancora';
        testo.textContent = 'A volte servono un paio di minuti: ricarica la pagina. Se hai pagato e il problema resta, scrivimi a repunto.studio@gmail.com e ti mando il file.';
      })
      .catch(function () { if (++tentativi < 15) setTimeout(chiedi, 2000); });
  })();
})();
