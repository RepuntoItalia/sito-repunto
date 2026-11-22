// Repunto — schede PDF: pulsante «Compra» e pagina di ringraziamento con il download.
// Il programma su Cloudflare (stesso del negozio) apre la pagina Stripe e, dopo il pagamento, dà il link al PDF.
var SCHEDE_API = 'https://repunto-negozio.repunto.workers.dev';

// pulsanti «Compra la scheda»: <button data-scheda="cuore">
var consenso = null;   // finestra con la casella del consenso (art. 59, lettera o), una per pagina
function chiediConsenso(id, poi) {
  if (!consenso) {
    var base = (document.querySelector('script[src$="negozio/schede.js"]').getAttribute('src') || '').replace('negozio/schede.js', '');
    consenso = document.createElement('dialog');
    consenso.className = 'consenso-scheda';
    consenso.setAttribute('aria-labelledby', 'consenso-titolo');
    consenso.style.cssText = 'width:min(520px,calc(100% - 28px));border:0;border-radius:20px;padding:28px;background:var(--carta);color:var(--ink)';
    consenso.innerHTML = '<form><h2 id="consenso-titolo" style="font-size:26px;margin-bottom:16px">Prima di pagare</h2>' +
      '<label style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;font-size:17px;line-height:1.6">' +
      '<input type="checkbox" required style="flex:0 0 24px;width:24px;height:24px;margin:2px 0 0;accent-color:var(--oro)">' +
      '<span>Chiedo di ricevere subito il PDF e so che così perdo il diritto di recesso di 14 giorni.</span></label>' +
      '<p style="font-size:14px;line-height:1.6;margin:14px 0 20px">Vale la garanzia legale di conformità sui contenuti digitali: se il file ha un problema lo sistemo o ti rimborso. ' +
      '<a href="' + base + 'condizioni-di-vendita">Condizioni di vendita</a></p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px"><button class="btn" type="submit">Continua al pagamento</button><button class="btn vuoto" type="button" data-no>Annulla</button></div></form>';
    document.body.appendChild(consenso);
    consenso.querySelector('[data-no]').addEventListener('click', function () { consenso.close(); });
    consenso.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); consenso.close(); consenso.poi(); });
  }
  consenso.querySelector('input').checked = false;
  consenso.poi = poi;
  consenso.showModal();
}
document.querySelectorAll('[data-scheda]').forEach(function (b) {
  b.addEventListener('click', function () { chiediConsenso(b.dataset.scheda, paga); });
  function paga() {
    var testo = b.textContent;
    b.disabled = true; b.textContent = 'Apro il pagamento…';
    fetch(SCHEDE_API + '/scheda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.dataset.scheda, consenso: true }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.url) { location.href = d.url; return; }
        throw new Error(d.errore || 'errore');
      })
      .catch(function (e) {
        b.disabled = false; b.textContent = testo;
        alert((e && e.message && e.message !== 'errore' ? e.message : 'Il pagamento non si è aperto.') + ' Riprova tra poco o scrivimi a repunto.studio@gmail.com.');
      });
  }
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
