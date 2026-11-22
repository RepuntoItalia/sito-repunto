// Repunto — funzione di recesso online (Codice del Consumo, art. 54-bis): dichiarazione, conferma, ricevuta con data e ora.
(function () {
  var API = 'https://repunto-negozio.repunto.workers.dev';
  var f = document.getElementById('recesso');
  if (!f) return;
  var passo2 = document.getElementById('recesso-conferma'), passo3 = document.getElementById('recesso-fatto');
  var conferma = document.getElementById('conferma-recesso'), err = document.getElementById('errore-recesso');
  var dati = null;

  function mostra(el) {
    [f, passo2, passo3].forEach(function (x) { x.hidden = x !== el; x.style.display = x === el ? '' : 'none'; });
    el.scrollIntoView({ block: 'center' });
    var h = el.querySelector('h2[tabindex]'); if (h) h.focus({ preventScroll: true });
  }
  passo2.style.display = 'none'; passo3.style.display = 'none';

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    dati = { nome: f.elements.nome.value.trim(), contratto: f.elements.contratto.value.trim(), email: f.elements.email.value.trim() };
    ['nome', 'contratto', 'email'].forEach(function (k) { document.getElementById('c-' + k).textContent = dati[k]; });
    err.textContent = '';
    mostra(passo2);
  });
  document.getElementById('correggi-recesso').addEventListener('click', function () { mostra(f); });

  conferma.addEventListener('click', function () {
    conferma.disabled = true; err.textContent = '';
    fetch(API + '/recesso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dati) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ricevuta) throw new Error('niente ricevuta');
        document.getElementById('ricevuta').textContent = d.ricevuta;
        document.getElementById('scarica-ricevuta').href = URL.createObjectURL(new Blob([d.ricevuta], { type: 'text/plain;charset=utf-8' }));
        mostra(passo3);
      })
      .catch(function () {
        conferma.disabled = false;
        err.textContent = 'Non è partito. Riprova, oppure scrivi adesso a repunto.studio@gmail.com: il recesso per email vale allo stesso modo.';
      });
  });
})();
