// Gefühlsmaschine — findet zu einem diffusen Zustand ein brauchbares Wort.
//
// Kein Modell, keine Anfrage, keine Kosten: reines Nachschlagen in gefuehle.js.
// Was der Nutzer hier eintippt, verlässt seinen Browser nicht.
//
// Einbau:
//   <div id="maschine"></div>
//   <script src="gefuehle.js"></script>
//   <script src="gefuehlsmaschine.js"></script>
//   <script>GFK_Gefuehlsmaschine.mounten(document.getElementById('maschine'));</script>
//
// Optionen von mounten(ziel, optionen):
//   startwort   String  — direkt mit diesem Wort in die Suche springen
//   beiAuswahl  fn({wort, beduerfnis, satz}) — wird bei jeder Auswahl gerufen.
//               Der Übersetzer hängt sich hier ein und setzt das Wort in seinen Satz.
//   knopftext   String  — Beschriftung des Übernahme-Knopfs. Fehlt sie,
//               erscheint stattdessen "Satz kopieren".
//
// Die Stile benutzen die Farbvariablen der Seite und fallen sonst auf
// eigene Werte zurück, damit die Maschine auch allein auf einer Seite steht.

(function (global) {
  'use strict';

  var STIL = [
    '.gm { font-family: var(--sans, system-ui, sans-serif); color: var(--ink, #202B26); }',
    '.gm *, .gm *::before, .gm *::after { box-sizing: border-box; }',
    '.gm-frage { font-family: var(--serif, Georgia, serif); font-size: 21px; line-height: 1.35; margin: 0 0 6px; }',
    '.gm-hilfe { font-size: 14px; color: var(--ink-soft, #4C594F); margin: 0 0 18px; max-width: 58ch; }',
    '.gm-schritt { padding: 22px 0 4px; }',
    '.gm-weg { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }',
    '.gm-karte { text-align: left; font: inherit; cursor: pointer; padding: 16px 18px;',
    '  background: var(--panel, #E4E6DA); border: 1px solid var(--line, #D7D8C7);',
    '  border-radius: 8px; color: inherit; transition: border-color .12s, transform .12s; }',
    '.gm-karte:hover { border-color: var(--feel, #954B36); }',
    '.gm-karte:active { transform: translateY(1px); }',
    '.gm-karte b { display: block; font-weight: 600; font-size: 16px; margin-bottom: 3px; }',
    '.gm-karte span { font-size: 13.5px; color: var(--ink-soft, #4C594F); line-height: 1.4; }',
    '.gm-gruppe { margin: 0 0 16px; }',
    '.gm-gruppe h4 { font-size: 12px; letter-spacing: .08em; text-transform: uppercase;',
    '  color: var(--ink-soft, #4C594F); font-weight: 600; margin: 0 0 8px; }',
    '.gm-woerter { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.gm-wort { font: inherit; font-size: 15px; cursor: pointer; padding: 7px 14px;',
    '  background: #fff; border: 1px solid var(--line, #D7D8C7); border-radius: 999px;',
    '  color: inherit; transition: background .12s, border-color .12s; }',
    '.gm-wort:hover { border-color: var(--feel, #954B36); background: var(--feel-tint, rgba(149,75,54,.14)); }',
    '.gm-wort[aria-pressed="true"] { background: var(--feel, #954B36); border-color: var(--feel, #954B36); color: #fff; }',
    '.gm-suche { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }',
    '.gm-feld { font: inherit; font-size: 16px; padding: 10px 14px; flex: 1 1 240px; min-width: 0;',
    '  border: 1px solid var(--line, #D7D8C7); border-radius: 6px; background: #fff; color: inherit; }',
    '.gm-feld:focus { outline: 2px solid var(--feel, #954B36); outline-offset: 1px; }',
    '.gm-knopf { font: inherit; font-size: 15px; cursor: pointer; padding: 10px 18px; border-radius: 6px;',
    '  border: 1px solid var(--brand, #3B6E68); background: var(--brand, #3B6E68); color: #fff; }',
    '.gm-knopf:hover { background: var(--brand-dark, #2B534F); border-color: var(--brand-dark, #2B534F); }',
    '.gm-knopf.gm-still { background: transparent; color: var(--ink-soft, #4C594F); border-color: var(--line, #D7D8C7); }',
    '.gm-knopf.gm-still:hover { background: var(--panel, #E4E6DA); color: var(--ink, #202B26); }',
    '.gm-hinweis { border-left: 3px solid var(--feel, #954B36); background: var(--feel-tint, rgba(149,75,54,.14));',
    '  padding: 14px 16px; border-radius: 0 6px 6px 0; margin: 18px 0; font-size: 14.5px; line-height: 1.5; }',
    '.gm-hinweis p { margin: 0 0 8px; } .gm-hinweis p:last-child { margin: 0; }',
    '.gm-ergebnis { margin-top: 24px; padding: 22px 24px; background: #fff;',
    '  border: 1px solid var(--line, #D7D8C7); border-top: 3px solid var(--feel, #954B36); border-radius: 8px; }',
    '.gm-satz { font-family: var(--serif, Georgia, serif); font-size: 24px; line-height: 1.35; margin: 0 0 4px; }',
    '.gm-satz em { font-style: normal; color: var(--feel, #954B36); }',
    '.gm-zeile { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }',
    '.gm-fuss { font-size: 13px; color: var(--ink-soft, #4C594F); margin: 18px 0 0; line-height: 1.5; }',
    '.gm-pfad { font-size: 13px; color: var(--ink-soft, #4C594F); margin: 0 0 14px; }',
    '.gm-pfad button { font: inherit; font-size: 13px; background: none; border: 0; padding: 0;',
    '  color: var(--brand, #3B6E68); cursor: pointer; text-decoration: underline; }',
    '.gm-trenner { border: 0; border-top: 1px solid var(--line, #D7D8C7); margin: 26px 0 0; }',
    '@media (prefers-reduced-motion: reduce) { .gm * { transition: none !important; } }'
  ].join('\n');

  var STAERKEN = [
    { grad: 1, titel: 'eher leicht' },
    { grad: 2, titel: 'deutlich' },
    { grad: 3, titel: 'stark' }
  ];

  // Der zweite Schritt heißt je nach Seite der ersten Achse anders.
  var ENERGIE = {
    unangenehm: [
      { q: 'ua', titel: 'Angespannt, unruhig, aufgeladen', hilfe: 'Es drängt, es kribbelt, es lässt dich nicht los.' },
      { q: 'uk', titel: 'Schwer, müde, leer', hilfe: 'Es zieht nach unten, es kostet Kraft, es macht still.' }
    ],
    angenehm: [
      { q: 'aa', titel: 'Wach, lebendig, in Bewegung', hilfe: 'Es zieht dich nach vorn, du hast Lust auf etwas.' },
      { q: 'ak', titel: 'Ruhig, gelöst, zufrieden', hilfe: 'Es ist still und trägt. Nichts drängt.' }
    ]
  };

  function stilEinmal() {
    if (document.getElementById('gm-stil')) return;
    var s = document.createElement('style');
    s.id = 'gm-stil';
    s.textContent = STIL;
    document.head.appendChild(s);
  }

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text != null) n.textContent = text;
    return n;
  }

  function leeren(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  function mounten(ziel, optionen) {
    if (!ziel) throw new Error('Gefühlsmaschine: kein Zielelement übergeben.');
    var wortschatz = global.GFK_WORTSCHATZ;
    if (!wortschatz) throw new Error('Gefühlsmaschine: gefuehle.js muss vorher geladen sein.');

    optionen = optionen || {};
    stilEinmal();

    var wurzel = el('div', 'gm');
    var buehne = el('div');
    var ausgabe = el('div');
    ausgabe.setAttribute('aria-live', 'polite');
    wurzel.appendChild(buehne);
    wurzel.appendChild(ausgabe);
    leeren(ziel);
    ziel.appendChild(wurzel);

    // Zustand: nur was wirklich nötig ist.
    var stand = { seite: null, wort: null, beduerfnis: null };

    // ---------- Bausteine ----------

    function schritt(frage, hilfe) {
      var s = el('div', 'gm-schritt');
      s.appendChild(el('p', 'gm-frage', frage));
      if (hilfe) s.appendChild(el('p', 'gm-hilfe', hilfe));
      return s;
    }

    function pfad(teile) {
      var p = el('p', 'gm-pfad');
      teile.forEach(function (t, i) {
        if (i) p.appendChild(document.createTextNode('  ›  '));
        if (t.zurueck) {
          var b = el('button', null, t.text);
          b.type = 'button';
          b.addEventListener('click', t.zurueck);
          p.appendChild(b);
        } else {
          p.appendChild(document.createTextNode(t.text));
        }
      });
      return p;
    }

    function karten(liste, beiKlick) {
      var w = el('div', 'gm-weg');
      liste.forEach(function (eintrag) {
        var k = el('button', 'gm-karte');
        k.type = 'button';
        k.appendChild(el('b', null, eintrag.titel));
        if (eintrag.hilfe) k.appendChild(el('span', null, eintrag.hilfe));
        k.addEventListener('click', function () { beiKlick(eintrag); });
        w.appendChild(k);
      });
      return w;
    }

    function wortknoepfe(woerter) {
      var box = el('div', 'gm-woerter');
      woerter.forEach(function (g) {
        var b = el('button', 'gm-wort', g.wort);
        b.type = 'button';
        b.setAttribute('aria-pressed', stand.wort && stand.wort.wort === g.wort ? 'true' : 'false');
        b.addEventListener('click', function () { waehlen(g); });
        box.appendChild(b);
      });
      return box;
    }

    // ---------- Einstieg ----------

    function start() {
      stand = { seite: null, wort: null, beduerfnis: null };
      leeren(buehne);
      leeren(ausgabe);

      var s = schritt(
        'Wie geht es dir damit?',
        'Zwei Fragen genügen meistens. Es muss nicht genau stimmen — du kannst jederzeit zurück.'
      );
      s.appendChild(karten([
        { titel: 'Eher nicht gut', hilfe: 'Etwas fehlt, etwas stört, etwas tut weh.', seite: 'unangenehm' },
        { titel: 'Eher gut', hilfe: 'Etwas stimmt, etwas trägt, etwas erleichtert.', seite: 'angenehm' }
      ], function (e) { energie(e.seite); }));
      buehne.appendChild(s);

      buehne.appendChild(el('hr', 'gm-trenner'));
      buehne.appendChild(sucheBlock());
    }

    function energie(seite) {
      stand.seite = seite;
      leeren(buehne);
      leeren(ausgabe);

      buehne.appendChild(pfad([
        { text: seite === 'angenehm' ? 'Eher gut' : 'Eher nicht gut', zurueck: start },
        { text: 'Wie viel Kraft?' }
      ]));

      var s = schritt(
        'Und wie viel Kraft steckt darin?',
        'Nicht wie stark das Gefühl ist, sondern ob es dich antreibt oder ausbremst.'
      );
      s.appendChild(karten(ENERGIE[seite], function (e) { woerter(e.q); }));
      buehne.appendChild(s);
    }

    function woerter(q) {
      leeren(buehne);
      leeren(ausgabe);

      var info = wortschatz.QUADRANTEN[q];
      var seite = info.angenehm ? 'angenehm' : 'unangenehm';
      stand.seite = seite;

      buehne.appendChild(pfad([
        { text: info.angenehm ? 'Eher gut' : 'Eher nicht gut', zurueck: start },
        { text: info.energie === 'viel' ? 'Mit Druck' : 'Ohne Druck', zurueck: function () { energie(seite); } },
        { text: 'Wort wählen' }
      ]));

      var s = schritt(
        'Welches Wort kommt am nächsten?',
        'Keins trifft es genau — such das, gegen das du am wenigsten Einwände hast.'
      );

      var alle = wortschatz.ausQuadrant(q);
      STAERKEN.forEach(function (st) {
        var teil = alle.filter(function (g) { return g.staerke === st.grad; });
        if (!teil.length) return;
        var gr = el('div', 'gm-gruppe');
        gr.appendChild(el('h4', null, st.titel));
        gr.appendChild(wortknoepfe(teil));
        s.appendChild(gr);
      });

      buehne.appendChild(s);
      // Merken, damit "Nachbarn zeigen" aus dem Ergebnis hierher zurückfindet.
      stand.quadrant = q;
    }

    // ---------- Suche ----------

    function sucheBlock(vorbelegt) {
      var s = schritt(
        'Oder: du hast schon ein Wort',
        'Tipp es ein. Manche Wörter klingen wie Gefühle, sagen aber mehr über die andere Person aus als über dich. Die Maschine sagt dir, welches.'
      );
      var reihe = el('div', 'gm-suche');
      var feld = el('input', 'gm-feld');
      feld.type = 'text';
      feld.placeholder = 'z. B. hintergangen, mutlos, ohnmächtig';
      feld.setAttribute('aria-label', 'Gefühlswort eingeben');
      if (vorbelegt) feld.value = vorbelegt;

      var knopf = el('button', 'gm-knopf', 'Nachschlagen');
      knopf.type = 'button';

      function los() { nachschlagen(feld.value); }
      knopf.addEventListener('click', los);
      feld.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); los(); }
      });

      reihe.appendChild(feld);
      reihe.appendChild(knopf);
      s.appendChild(reihe);
      s.dataset.feld = '1';
      s._feld = feld;
      return s;
    }

    function nachschlagen(eingabe) {
      var ergebnis = wortschatz.suche(eingabe);
      leeren(ausgabe);

      if (ergebnis.art === 'gefuehl') {
        waehlen(ergebnis.treffer);
        return;
      }

      if (ergebnis.art === 'pseudo') {
        var h = el('div', 'gm-hinweis');
        var p1 = el('p');
        p1.appendChild(document.createTextNode('„' + ergebnis.wort + '“ beschreibt, was die andere Person '));
        p1.appendChild(el('em', null, 'getan'));
        p1.appendChild(document.createTextNode(' hat — nicht, wie es dir geht. Wer es hört, hört einen Vorwurf und wehrt ihn ab.'));
        h.appendChild(p1);
        h.appendChild(el('p', null, 'Darunter liegt fast immer ein echtes Gefühl. Welches passt?'));
        ausgabe.appendChild(h);
        ausgabe.appendChild(wortknoepfe(ergebnis.vorschlaege));
        return;
      }

      if (ergebnis.art === 'aehnlich') {
        ausgabe.appendChild(el('p', 'gm-hilfe', 'Das Wort kenne ich nicht. Meintest du eines davon?'));
        ausgabe.appendChild(wortknoepfe(ergebnis.treffer.slice(0, 8)));
        return;
      }

      var k = el('div', 'gm-hinweis');
      k.appendChild(el('p', null, 'Dieses Wort steht nicht in der Liste. Das heißt nicht, dass es falsch ist — die Liste ist begrenzt.'));
      var z = el('p', 'gm-zeile');
      var b = el('button', 'gm-knopf gm-still', 'Lieber in zwei Fragen suchen');
      b.type = 'button';
      b.addEventListener('click', start);
      z.appendChild(b);
      k.appendChild(z);
      ausgabe.appendChild(k);
    }

    // ---------- Ergebnis ----------

    function waehlen(gefuehl) {
      stand.wort = gefuehl;
      stand.beduerfnis = null;
      stand.quadrant = gefuehl.q;
      // Das gewählte Wort in der Liste darüber mitmarkieren, sonst sieht man
      // beim Weiterprobieren nicht mehr, wo man gerade steht.
      var offen = buehne.querySelectorAll('.gm-wort');
      for (var i = 0; i < offen.length; i++) {
        offen[i].setAttribute('aria-pressed', offen[i].textContent === gefuehl.wort ? 'true' : 'false');
      }
      zeigen();
      ausgabe.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function satzText() {
      if (!stand.wort) return '';
      return stand.beduerfnis
        ? 'Ich bin ' + stand.wort.wort + ', weil mir ' + stand.beduerfnis + ' wichtig ist.'
        : 'Ich bin ' + stand.wort.wort + '.';
    }

    function zeigen() {
      leeren(ausgabe);
      var g = stand.wort;

      var box = el('div', 'gm-ergebnis');

      var satz = el('p', 'gm-satz');
      satz.appendChild(document.createTextNode('Ich bin '));
      satz.appendChild(el('em', null, g.wort));
      if (stand.beduerfnis) {
        satz.appendChild(document.createTextNode(', weil mir '));
        satz.appendChild(el('em', null, stand.beduerfnis));
        satz.appendChild(document.createTextNode(' wichtig ist.'));
      } else {
        satz.appendChild(document.createTextNode('.'));
      }
      box.appendChild(satz);

      var gr = el('div', 'gm-gruppe');
      gr.style.marginTop = '20px';
      gr.appendChild(el('h4', null, 'Dahinter steckt vermutlich ein Bedürfnis nach'));
      var chips = el('div', 'gm-woerter');
      g.beduerfnisse.forEach(function (b) {
        var c = el('button', 'gm-wort', b);
        c.type = 'button';
        c.setAttribute('aria-pressed', stand.beduerfnis === b ? 'true' : 'false');
        c.addEventListener('click', function () {
          stand.beduerfnis = (stand.beduerfnis === b) ? null : b;
          zeigen();
        });
        chips.appendChild(c);
      });
      gr.appendChild(chips);
      box.appendChild(gr);

      var zeile = el('div', 'gm-zeile');

      if (typeof optionen.beiAuswahl === 'function') {
        var u = el('button', 'gm-knopf', optionen.knopftext || 'Wort übernehmen');
        u.type = 'button';
        u.addEventListener('click', function () {
          optionen.beiAuswahl({ wort: g.wort, beduerfnis: stand.beduerfnis, satz: satzText(), gefuehl: g });
        });
        zeile.appendChild(u);
      } else {
        var kopie = el('button', 'gm-knopf', 'Satz kopieren');
        kopie.type = 'button';
        kopie.addEventListener('click', function () {
          kopieren(satzText(), kopie);
        });
        zeile.appendChild(kopie);
      }

      var nachbar = el('button', 'gm-knopf gm-still', 'Passt nicht ganz');
      nachbar.type = 'button';
      nachbar.addEventListener('click', function () { woerter(g.q); });
      zeile.appendChild(nachbar);

      var neu = el('button', 'gm-knopf gm-still', 'Von vorn');
      neu.type = 'button';
      neu.addEventListener('click', start);
      zeile.appendChild(neu);

      box.appendChild(zeile);

      box.appendChild(el('p', 'gm-fuss',
        'Das Bedürfnis ist ein Vorschlag, keine Diagnose. Wenn keins passt, stimmt vielleicht das Wort noch nicht — oder dein Bedürfnis steht nicht in der Liste. Beides ist in Ordnung.'));

      ausgabe.appendChild(box);
    }

    function kopieren(text, knopf) {
      var alt = knopf.textContent;
      function fertig(ok) {
        knopf.textContent = ok ? 'Kopiert' : 'Ging nicht';
        setTimeout(function () { knopf.textContent = alt; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { fertig(true); }, function () { fertig(false); });
        return;
      }
      var f = document.createElement('textarea');
      f.value = text;
      f.setAttribute('readonly', '');
      f.style.position = 'absolute';
      f.style.left = '-9999px';
      document.body.appendChild(f);
      f.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(f);
      fertig(ok);
    }

    // ---------- Los ----------

    start();
    if (optionen.startwort) {
      leeren(buehne);
      var block = sucheBlock(optionen.startwort);
      buehne.appendChild(block);
      nachschlagen(optionen.startwort);
    }

    return {
      neu: start,
      nachschlagen: function (w) {
        leeren(buehne);
        buehne.appendChild(sucheBlock(w));
        nachschlagen(w);
      },
      stand: function () { return { wort: stand.wort && stand.wort.wort, beduerfnis: stand.beduerfnis, satz: satzText() }; }
    };
  }

  global.GFK_Gefuehlsmaschine = { mounten: mounten };
})(typeof window !== 'undefined' ? window : this);
