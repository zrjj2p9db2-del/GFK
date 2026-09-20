// Baut die Testfassung: beide Seiten als je eine einzige Datei.
//
//   node bauen.js
//
// Ergebnis in test/:
//   index.html               — die Seite mit eingebauter Gefühlsmaschine
//   gefuehlsmaschine.html    — die Maschine allein
//
// Beide Dateien enthalten gefuehle.js und gefuehlsmaschine.js im Quelltext.
// Dadurch laufen sie überall: hochgeladen unter /test, per Doppelklick
// geöffnet, oder in einem Vorschaufenster. Nichts nachzuladen, nichts zu
// verlinken, nichts, was schiefgehen kann.
//
// Für den endgültigen Einbau in die Live-Seite gilt das nicht: dort werden
// die beiden Dateien normal per <script src> eingebunden, damit es sie nur
// einmal gibt. Diese Fassung hier ist ausdrücklich zum Ausprobieren.

'use strict';

const fs = require('fs');
const path = require('path');

// An der Wurzel steht die Landingpage. Die Anwendung liegt daneben als
// public/app.html und ist unter /app.html erreichbar — das ist zugleich
// die Vorlage, aus der hier die Testfassung in public/test/ entsteht.
//
// Damit gibt es drei Adressen und keinen unsichtbaren Ordner:
//   /            Landingpage
//   /app.html    die Anwendung, wie sie ist
//   /test        dieselbe Anwendung mit der Gefühlsmaschine
//
// Aufruf aus der Wurzel des Repositorys:
//
//   node gefuehlsmaschine/bauen.js
//
const HIER = __dirname;
const QUELLDATEI = process.argv[2] || path.join(HIER, '..', 'public', 'app.html');
const ZIEL = process.argv[3] || path.join(HIER, '..', 'public', 'test');

function lies(p) { return fs.readFileSync(p, 'utf8'); }

const wortschatz = lies(path.join(HIER, 'gefuehle.js'));
const maschine = lies(path.join(HIER, 'gefuehlsmaschine.js'));

// Ein Skript-Ende im eingebetteten Quelltext würde das umschließende
// <script> vorzeitig beenden — auch wenn es nur in einem Kommentar steht.
// Deshalb wird der Dateiinhalt entschärft, und ausdrücklich nur er:
// die echten Tags drumherum müssen unangetastet bleiben.
// Auch die öffnenden Tags in den Kommentaren werden unkenntlich gemacht.
// Nötig ist nur das schließende, aber so zählt die Prüfung unten
// ausschließlich echte Tags — und wird dadurch aussagekräftig.
function entschaerfen(s) {
  return s.replace(/<\/script>/gi, '<\\/script>').replace(/<script\b/gi, '<\\script');
}

const SKRIPTE = [
  '<!-- Gefühlsmaschine — Wortschatz -->',
  '<script>',
  entschaerfen(wortschatz),
  '</script>',
  '<!-- Gefühlsmaschine — Bedienung -->',
  '<script>',
  entschaerfen(maschine),
  '</script>'
].join('\n');

fs.mkdirSync(ZIEL, { recursive: true });

// ---------------------------------------------------------------- Seite 1

if (!fs.existsSync(QUELLDATEI)) {
  throw new Error(
    path.resolve(QUELLDATEI) + '\ngibt es nicht.\n' +
    'Dort wird die Anwendung erwartet — die Seite, die früher public/index.html hieß.\n' +
    'Entweder dorthin kopieren, oder den richtigen Pfad mitgeben:\n' +
    '  node gefuehlsmaschine/bauen.js <pfad/zur/anwendung.html>'
  );
}

let seite = lies(QUELLDATEI);

// Zeigt der Pfad versehentlich auf die Landingpage, beschwert sich das Skript
// sonst über fehlende Karten. Besser, es sagt gleich, was wirklich los ist.
if (!seite.includes('id="translate-panel"')) {
  const landing = seite.includes('Diese Seite entsteht gerade');
  throw new Error(
    path.resolve(QUELLDATEI) + '\nist nicht die Anwendung' +
    (landing ? ', sondern die Landingpage' : '') + '.\n' +
    'Die Anwendung ist die Seite, die früher public/index.html hieß.'
  );
}

// Erkennbar machen, dass das nicht die Live-Seite ist.
seite = seite.replace(
  '<title>GFK-Kompass — Vom Vorwurf zur Verständigung</title>',
  '<title>TEST — GFK-Kompass</title>\n<meta name="robots" content="noindex, nofollow">'
);

const BANNER = [
  '<div style="background:#954B36;color:#fff;font:500 14px/1.4 system-ui,sans-serif;',
  'padding:9px 16px;text-align:center;position:sticky;top:0;z-index:999">',
  'Testfassung — nicht die öffentliche Seite. Änderungen hier ändern nichts an ',
  '<a href="/" style="color:#fff">gfk-kompass</a>.',
  '</div>'
].join('');

seite = seite.replace(/<body([^>]*)>/i, '<body$1>\n' + BANNER);

// ---- Die Gefühlsmaschine als dritte Karte unter "Werkzeuge" -------------
//
// Ohne diesen Schritt ist die Maschine von der Startseite aus unsichtbar.
// Sie gehört zu den Werkzeugen, nicht zu den Spielen: sie prüft nichts ab
// und hat kein Richtig, sie gibt etwas heraus. Der Punkt in der Farbe des
// Gefühl-Schritts ordnet sie ein, ohne dass man etwas lesen muss.

const KARTE_PRACTICE_ENDE = `          <span class="exercise-desc">Schreib selbst die vier Schritte, bekomme KI-Feedback dazu</span>
        </button>`;
if (!seite.includes(KARTE_PRACTICE_ENDE)) {
  throw new Error('Die Karte "Selbst üben" wurde nicht gefunden. Hat sich index.html geändert?');
}
seite = seite.replace(KARTE_PRACTICE_ENDE, KARTE_PRACTICE_ENDE + `
        <button type="button" class="exercise-card" id="mode-gefuehl-btn" data-mode="gefuehl">
          <span class="dot cat-feel"></span>
          <span class="exercise-name">Gefühlsmaschine</span>
          <span class="exercise-desc">Finde das Wort für das, was in dir los ist — in zwei Fragen</span>
        </button>`);

// Das zugehörige Panel hinter den Übungsbereich, noch innerhalb der Gruppe.
const GRUPPE_ENDE = `      <p class="error-msg" id="practice-error-msg" hidden></p>
    </div>
    </div>`;
if (!seite.includes(GRUPPE_ENDE)) {
  throw new Error('Das Ende der Werkzeug-Gruppe wurde nicht gefunden. Hat sich index.html geändert?');
}
seite = seite.replace(GRUPPE_ENDE, `      <p class="error-msg" id="practice-error-msg" hidden></p>
    </div>

    <div id="gefuehl-panel" hidden>
      <h2>Gefühlsmaschine</h2>
      <p class="hint">Manchmal weiß man, dass etwas los ist, aber nicht, wie es heißt. Zwei Fragen genügen meistens — oder tipp ein Wort ein, bei dem du unsicher bist, ob es überhaupt ein Gefühl ist.</p>
      <div id="maschine-werkzeug"></div>
    </div>
    </div>`);

// Die feste Wörterliste im Übungsbereich durch die Maschine ersetzen.
// Die Bedürfnisliste bleibt: die Maschine schlägt nur die zum gewählten
// Gefühl passenden vor, das vollständige Verzeichnis ist weiter nützlich.
const ALT_GEFUEHLE = /<div>\s*<span class="word-list-label">Gefühle<\/span>[\s\S]*?<\/div>/;
if (!ALT_GEFUEHLE.test(seite)) {
  throw new Error('Die Gefühlsliste im Übungsbereich wurde nicht gefunden. Hat sich index.html geändert?');
}
seite = seite.replace(ALT_GEFUEHLE, [
  '<div>',
  '  <span class="word-list-label">Das richtige Gefühlswort finden</span>',
  '  <div id="maschine-uebung"></div>',
  '</div>'
].join('\n'));

// Die Überschrift der Klappe anpassen.
seite = seite.replace(
  '<summary>Gefühle &amp; Bedürfnisse zum Nachschlagen</summary>',
  '<summary>Gefühlsmaschine &amp; Bedürfnisse zum Nachschlagen</summary>'
).replace(
  '<summary>Gefühle & Bedürfnisse zum Nachschlagen</summary>',
  '<summary>Gefühlsmaschine &amp; Bedürfnisse zum Nachschlagen</summary>'
);

// ---- Die Umschaltung kennt bisher genau zwei Werkzeuge ------------------
//
// WERKZEUG_PANELS wird um einen dritten Eintrag erweitert. Der bestehende
// Kommentar im Quelltext sagt ausdrücklich das Gegenteil und wird deshalb
// mitgeändert, damit er nicht in die Irre führt.

const ALT_PANELS = `  // Werkzeuge (Text übersetzen / Selbst üben) — klassische Reiter, bleiben immer nur zu zweit.
  const WERKZEUG_PANELS = {
    translate: { btn: modeTranslateBtn, panel: translatePanel },
    practice: { btn: modePracticeBtn, panel: practicePanel }
  };`;
if (!seite.includes(ALT_PANELS)) {
  throw new Error('Die Werkzeug-Umschaltung wurde nicht gefunden. Hat sich index.html geändert?');
}
seite = seite.replace(ALT_PANELS, `  // Werkzeuge (Text übersetzen / Selbst üben / Gefühlsmaschine) — klassische Reiter.
  const modeGefuehlBtn = document.getElementById('mode-gefuehl-btn');
  const gefuehlPanel = document.getElementById('gefuehl-panel');
  const WERKZEUG_PANELS = {
    translate: { btn: modeTranslateBtn, panel: translatePanel },
    practice: { btn: modePracticeBtn, panel: practicePanel },
    gefuehl: { btn: modeGefuehlBtn, panel: gefuehlPanel }
  };`);

const ALT_KLICKS = `  modePracticeBtn.addEventListener('click', () => setWerkzeugMode('practice'));`;
if (!seite.includes(ALT_KLICKS)) {
  throw new Error('Die Klickbehandlung der Werkzeuge wurde nicht gefunden.');
}
seite = seite.replace(ALT_KLICKS, ALT_KLICKS +
  `\n  modeGefuehlBtn.addEventListener('click', () => setWerkzeugMode('gefuehl'));`);

const ANHANG = SKRIPTE + `
<script>
(function () {
  // Das Ergebnis in die Übungsfelder schreiben. Das input-Ereignis wird
  // mitgesendet, damit ein still gesetzter Wert für die Seite genauso
  // aussieht wie ein getippter. Heute horcht dort nichts darauf; sobald
  // etwas dazukommt — ein Zeichenzähler, ein Entwurfsspeicher — greift es
  // von selbst, ohne dass jemand an diese Stelle denken muss.
  function inDieFelder(wahl) {
    var g = document.getElementById('practice-feel');
    var b = document.getElementById('practice-need');
    if (g) {
      g.value = 'Ich bin ' + wahl.wort + '.';
      g.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (b && wahl.beduerfnis) {
      b.value = wahl.beduerfnis;
      b.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (g) { g.focus(); g.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }

  // Als eigenes Werkzeug. Wer hier ein Wort findet, will meistens weiter —
  // deshalb führt der Knopf hinüber zu "Selbst üben", statt in eine Sackgasse.
  GFK_Gefuehlsmaschine.mounten(document.getElementById('maschine-werkzeug'), {
    knopftext: 'Damit weiterarbeiten',
    beiAuswahl: function (wahl) {
      var uebenKnopf = document.getElementById('mode-practice-btn');
      if (uebenKnopf) uebenKnopf.click();
      inDieFelder(wahl);
    }
  });

  // Und noch einmal im Übungsbereich selbst, wo sie gebraucht wird,
  // während jemand an seinen vier Schritten sitzt.
  GFK_Gefuehlsmaschine.mounten(document.getElementById('maschine-uebung'), {
    knopftext: 'In die Felder übernehmen',
    beiAuswahl: inDieFelder
  });
})();
</script>
`;

seite = seite.replace(/<\/body>/i, ANHANG + '\n</body>');
fs.writeFileSync(path.join(ZIEL, 'index.html'), seite);

// ---------------------------------------------------------------- Seite 2

let allein = lies(path.join(HIER, 'gefuehlsmaschine.html'));
allein = allein
  .replace('<script src="gefuehle.js"></script>\n<script src="gefuehlsmaschine.js"></script>', SKRIPTE)
  .replace('<a class="zurueck" href="index.html">← zurück zum GFK-Kompass</a>',
           '<a class="zurueck" href="index.html">← zurück zum GFK-Kompass</a>');
fs.writeFileSync(path.join(ZIEL, 'gefuehlsmaschine.html'), allein);

// ---------------------------------------------------------------- Bericht

console.log('gelesen aus   ' + path.resolve(QUELLDATEI));
console.log('geschrieben   ' + path.resolve(ZIEL) + '\n');

for (const datei of ['index.html', 'gefuehlsmaschine.html']) {
  const p = path.join(ZIEL, datei);
  const groesse = (fs.statSync(p).size / 1024).toFixed(0);
  const inhalt = lies(p);
  const eingebaut = inhalt.includes('GFK_Gefuehlsmaschine') && inhalt.includes('const GEFUEHLE');

  // Genau dieser Fehler ist beim Bauen schon einmal passiert: die Entschärfung
  // traf auch die echten Tags, das Skript wurde nie geschlossen, und die Seite
  // lud stumm nichts. Ein Zählen der Tags hätte es sofort gezeigt.
  const auf = (inhalt.match(/<script\b/gi) || []).length;
  const zu = (inhalt.match(/<\/script>/gi) || []).length;
  const ausgewogen = auf === zu;

  console.log(`${datei.padEnd(24)} ${groesse.padStart(4)} kB   ` +
    `Maschine eingebaut: ${eingebaut ? 'ja' : 'NEIN'}   ` +
    `Skript-Tags: ${auf}/${zu} ${ausgewogen ? 'ok' : 'UNGLEICH'}`);

  if (!eingebaut || !ausgewogen) process.exitCode = 1;
}
