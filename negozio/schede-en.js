// Repunto — schede PDF in inglese: consenso e pagamento, pagina di ringraziamento con il download.
(function () {
  var API = 'https://repunto-negozio.repunto.workers.dev';
  var MAIL = 'repunto.studio@gmail.com';

  var modulo = document.getElementById('compra-en');
  if (modulo) {
    modulo.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = modulo.querySelector('button'), err = document.getElementById('errore-en'), testo = btn.textContent;
      if (!modulo.elements.consenso.checked) return;
      btn.disabled = true; btn.textContent = 'Opening payment…'; err.textContent = '';
      fetch(API + '/scheda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: modulo.dataset.schedaEn, consenso: true }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (!d.url) throw new Error('no url'); location.href = d.url; })
        .catch(function () {
          btn.disabled = false; btn.textContent = testo;
          err.textContent = 'The payment page did not open. Please try again in a moment or write to ' + MAIL + '.';
        });
    });
    // tornando indietro da Stripe il pulsante deve funzionare di nuovo
    window.addEventListener('pageshow', function () {
      var btn = modulo.querySelector('button'); btn.disabled = false; btn.textContent = 'Continue to payment';
    });
  }

  if (!document.getElementById('download-en')) return;
  var s = new URLSearchParams(location.search).get('s'), n = 0;
  var titolo = document.getElementById('dl-titolo'), info = document.getElementById('dl-testo'), dl = document.getElementById('dl-btn');
  if (!s) { titolo.textContent = 'The payment code is missing'; info.textContent = 'Open the link in the email you received, or write to me.'; return; }
  function riprova() {
    if (++n < 15) { setTimeout(chiedi, 2000); return; }
    titolo.textContent = 'I can\'t confirm the payment yet';
    info.textContent = 'It can take a couple of minutes: reload this page. If you paid and the problem continues, write to ' + MAIL + '.';
  }
  function chiedi() {
    fetch(API + '/scheda-stato?s=' + encodeURIComponent(s), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.stato !== 'pagata') return riprova();
        titolo.textContent = d.titolo;
        info.textContent = 'The link is valid until ' + new Date(d.scade * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Save the file as soon as you download it.';
        dl.href = d.link; dl.hidden = false;
      })
      .catch(riprova);
  }
  chiedi();
})();
