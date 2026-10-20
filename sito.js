// Repunto — script comune a tutte le pagine.

// Indirizzo a cui arrivano i messaggi dei moduli «scrivimi» (scelto da Greta il 20/10/2026).
var REPUNTO_EMAIL = 'repunto.studio@gmail.com';
// Modulo di contatto di Payhip (resta attivo sullo shop): alternativa per chi non ha un'app di posta.
var REPUNTO_MODULO_PAYHIP = 'https://shop.repunto.it/contact';

// menu sul telefono
(function () {
  var t = document.querySelector('.testata'), b = document.querySelector('.menu-btn');
  if (!t || !b) return;
  b.addEventListener('click', function () {
    var a = t.classList.toggle('aperta');
    b.setAttribute('aria-expanded', a ? 'true' : 'false');
  });
})();

// iscrizione alla newsletter (MailerLite, modulo «Iscrizione Sito Repunto», doppia conferma)
document.querySelectorAll('form.iscrizione').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = f.querySelector('button');
    btn.disabled = true;
    fetch(f.action, { method: 'POST', body: new FormData(f), mode: 'no-cors' })
      .then(function () { f.classList.add('inviato'); })
      .catch(function () { btn.disabled = false; alert('Qualcosa non ha funzionato: riprova tra poco.'); });
  });
});

// moduli «scrivimi»: preparano il messaggio e aprono l'app di posta di chi scrive
document.querySelectorAll('form.scrivimi').forEach(function (f) {
  var alt = f.querySelector('.modulo-payhip');
  if (alt) alt.href = REPUNTO_MODULO_PAYHIP;
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
