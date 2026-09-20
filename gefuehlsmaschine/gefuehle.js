// Wortschatz der Gefühlsmaschine.
//
// Eigene Zusammenstellung für GFK-Kompass, zugeschnitten auf Eltern in
// Eltern-Kind-Entfremdungs-Situationen. Bewusst kein Übertrag aus vorhandenen
// GFK-Listen: Einzelne Wörter sind Allgemeingut, eine fremde Zusammenstellung
// wäre es nicht.
//
// FORM: Jedes Wort steht so, dass der Satz "Ich bin ..." grammatisch aufgeht.
// Deshalb "mutlos" und nicht "Mutlosigkeit", deshalb kein "ich spüre Wut".
// Nur so lässt sich ein Wort im Übersetzer austauschen, ohne den Satz umzubauen.
//
// QUADRANT: zwei Achsen.
//   ua = unangenehm, viel Energie      aa = angenehm, viel Energie
//   uk = unangenehm, wenig Energie     ak = angenehm, wenig Energie
// Die waagerechte Achse entspricht der GFK-Unterteilung in Gefühle bei
// erfüllten und bei unerfüllten Bedürfnissen. Die senkrechte trennt, was
// sonst zusammenfällt: Wut und Trauer sind beide unangenehm, aber nicht gleich.
//
// STAERKE: 1 leise, 2 deutlich, 3 stark. Dient der Sortierung innerhalb eines
// Quadranten, damit die Liste von "unruhig" zu "panisch" führt und nicht
// alphabetisch.
//
// BEDUERFNISSE: was typischerweise dahintersteht. Als Angebot gedacht, nicht
// als Diagnose. Immer mehrere, damit die Zuordnung nicht zwingend wirkt.
//
// Selbsttest: node gefuehle.js

'use strict';

const GEFUEHLE = [
  // ---------------------------------------------------------------------
  // unangenehm, viel Energie
  // ---------------------------------------------------------------------
  { wort: 'unruhig',        q: 'ua', staerke: 1, beduerfnisse: ['Ruhe', 'Sicherheit', 'Klarheit'] },
  { wort: 'angespannt',     q: 'ua', staerke: 1, beduerfnisse: ['Ruhe', 'Erholung', 'Sicherheit'] },
  { wort: 'nervös',         q: 'ua', staerke: 1, beduerfnisse: ['Sicherheit', 'Orientierung'] },
  { wort: 'gereizt',        q: 'ua', staerke: 1, beduerfnisse: ['Ruhe', 'Rücksicht', 'Freiraum'] },
  { wort: 'ungeduldig',     q: 'ua', staerke: 1, beduerfnisse: ['Klarheit', 'Wirksamkeit'] },
  { wort: 'aufgewühlt',     q: 'ua', staerke: 2, beduerfnisse: ['Ruhe', 'Verständnis'] },
  { wort: 'besorgt',        q: 'ua', staerke: 2, beduerfnisse: ['Sicherheit', 'Schutz', 'Verlässlichkeit'] },
  { wort: 'beunruhigt',     q: 'ua', staerke: 2, beduerfnisse: ['Sicherheit', 'Klarheit'] },
  { wort: 'verunsichert',   q: 'ua', staerke: 2, beduerfnisse: ['Sicherheit', 'Vertrauen', 'Orientierung'] },
  { wort: 'misstrauisch',   q: 'ua', staerke: 2, beduerfnisse: ['Vertrauen', 'Verlässlichkeit', 'Ehrlichkeit'] },
  { wort: 'ärgerlich',      q: 'ua', staerke: 2, beduerfnisse: ['Respekt', 'Rücksicht', 'Fairness'] },
  { wort: 'empört',         q: 'ua', staerke: 2, beduerfnisse: ['Fairness', 'Respekt'] },
  { wort: 'frustriert',     q: 'ua', staerke: 2, beduerfnisse: ['Wirksamkeit', 'Mitsprache', 'Fortschritt'] },
  { wort: 'angestrengt',    q: 'ua', staerke: 2, beduerfnisse: ['Erholung', 'Unterstützung'] },
  { wort: 'alarmiert',      q: 'ua', staerke: 2, beduerfnisse: ['Schutz', 'Sicherheit'] },
  { wort: 'wütend',         q: 'ua', staerke: 3, beduerfnisse: ['Respekt', 'Fairness', 'Grenzen'] },
  { wort: 'zornig',         q: 'ua', staerke: 3, beduerfnisse: ['Fairness', 'Würde'] },
  { wort: 'verzweifelt',    q: 'ua', staerke: 3, beduerfnisse: ['Hoffnung', 'Unterstützung', 'Verbindung'] },
  { wort: 'panisch',        q: 'ua', staerke: 3, beduerfnisse: ['Sicherheit', 'Schutz'] },
  { wort: 'fassungslos',    q: 'ua', staerke: 3, beduerfnisse: ['Verständnis', 'Orientierung'] },
  { wort: 'aufgebracht',    q: 'ua', staerke: 3, beduerfnisse: ['Respekt', 'Gehörtwerden'] },
  { wort: 'überfordert',    q: 'ua', staerke: 3, beduerfnisse: ['Unterstützung', 'Erholung', 'Klarheit'] },
  // Nachtrag aus der EKE-Gefühlsliste.
  { wort: 'genervt',        q: 'ua', staerke: 1, beduerfnisse: ['Ruhe', 'Freiraum', 'Rücksicht'] },
  { wort: 'gespannt',       q: 'ua', staerke: 1, beduerfnisse: ['Klarheit', 'Gewissheit'] },
  { wort: 'ängstlich',      q: 'ua', staerke: 2, beduerfnisse: ['Sicherheit', 'Schutz', 'Halt'] },
  { wort: 'eifersüchtig',   q: 'ua', staerke: 2, beduerfnisse: ['Verbindung', 'Zugehörigkeit', 'Gewissheit'] },
  { wort: 'zerrissen',      q: 'ua', staerke: 3, beduerfnisse: ['Klarheit', 'Entlastung', 'Frieden'] },
  { wort: 'verbittert',     q: 'ua', staerke: 3, beduerfnisse: ['Gerechtigkeit', 'Anerkennung', 'Frieden'] },

  // ---------------------------------------------------------------------
  // unangenehm, wenig Energie
  // ---------------------------------------------------------------------
  { wort: 'nachdenklich',   q: 'uk', staerke: 1, beduerfnisse: ['Klarheit', 'Orientierung'] },
  { wort: 'unsicher',       q: 'uk', staerke: 1, beduerfnisse: ['Sicherheit', 'Orientierung', 'Vertrauen'] },
  { wort: 'ratlos',         q: 'uk', staerke: 1, beduerfnisse: ['Orientierung', 'Unterstützung'] },
  { wort: 'unzufrieden',    q: 'uk', staerke: 1, beduerfnisse: ['Wirksamkeit', 'Mitsprache'] },
  { wort: 'bedrückt',       q: 'uk', staerke: 2, beduerfnisse: ['Leichtigkeit', 'Verständnis'] },
  { wort: 'traurig',        q: 'uk', staerke: 2, beduerfnisse: ['Verbindung', 'Nähe', 'Trost'] },
  { wort: 'enttäuscht',     q: 'uk', staerke: 2, beduerfnisse: ['Verlässlichkeit', 'Vertrauen'] },
  { wort: 'mutlos',         q: 'uk', staerke: 2, beduerfnisse: ['Hoffnung', 'Verbindung', 'Ermutigung'] },
  { wort: 'entmutigt',      q: 'uk', staerke: 2, beduerfnisse: ['Hoffnung', 'Wirksamkeit'] },
  { wort: 'einsam',         q: 'uk', staerke: 2, beduerfnisse: ['Verbindung', 'Zugehörigkeit', 'Nähe'] },
  { wort: 'müde',           q: 'uk', staerke: 2, beduerfnisse: ['Erholung', 'Ruhe'] },
  { wort: 'erschöpft',      q: 'uk', staerke: 2, beduerfnisse: ['Erholung', 'Unterstützung'] },
  { wort: 'schwer',         q: 'uk', staerke: 2, beduerfnisse: ['Leichtigkeit', 'Trost'] },
  { wort: 'wehmütig',       q: 'uk', staerke: 2, beduerfnisse: ['Verbindung', 'Erinnerung'] },
  { wort: 'beschämt',       q: 'uk', staerke: 2, beduerfnisse: ['Annahme', 'Würde', 'Milde'] },
  { wort: 'schuldig',       q: 'uk', staerke: 2, beduerfnisse: ['Wiedergutmachung', 'Milde'] },
  { wort: 'sehnsüchtig',    q: 'uk', staerke: 2, beduerfnisse: ['Nähe', 'Verbindung'] },
  { wort: 'hilflos',        q: 'uk', staerke: 3, beduerfnisse: ['Unterstützung', 'Wirksamkeit', 'Halt'] },
  { wort: 'ohnmächtig',     q: 'uk', staerke: 3, beduerfnisse: ['Wirksamkeit', 'Mitsprache', 'Selbstbestimmung'] },
  { wort: 'leer',           q: 'uk', staerke: 3, beduerfnisse: ['Sinn', 'Verbindung'] },
  { wort: 'niedergeschlagen', q: 'uk', staerke: 3, beduerfnisse: ['Trost', 'Hoffnung', 'Verbindung'] },
  { wort: 'gekränkt',       q: 'uk', staerke: 3, beduerfnisse: ['Wertschätzung', 'Respekt', 'Würde'] },
  { wort: 'resigniert',     q: 'uk', staerke: 3, beduerfnisse: ['Hoffnung', 'Wirksamkeit'] },
  // Nachtrag aus der EKE-Gefühlsliste.
  { wort: 'verwirrt',       q: 'uk', staerke: 1, beduerfnisse: ['Klarheit', 'Orientierung'] },
  { wort: 'befangen',       q: 'uk', staerke: 1, beduerfnisse: ['Sicherheit', 'Leichtigkeit'] },
  { wort: 'unbehaglich',    q: 'uk', staerke: 1, beduerfnisse: ['Sicherheit', 'Ruhe'] },
  { wort: 'vorsichtig',     q: 'uk', staerke: 1, beduerfnisse: ['Sicherheit', 'Vertrauen', 'Schutz'] },
  { wort: 'beklommen',      q: 'uk', staerke: 2, beduerfnisse: ['Sicherheit', 'Halt', 'Ruhe'] },
  { wort: 'fremd',          q: 'uk', staerke: 2, beduerfnisse: ['Vertrautheit', 'Nähe', 'Zugehörigkeit'] },
  { wort: 'gleichgültig',   q: 'uk', staerke: 2, beduerfnisse: ['Schutz', 'Abstand', 'Erholung'] },
  { wort: 'verloren',       q: 'uk', staerke: 3, beduerfnisse: ['Orientierung', 'Halt', 'Zugehörigkeit'] },
  { wort: 'betäubt',        q: 'uk', staerke: 3, beduerfnisse: ['Schutz', 'Lebendigkeit', 'Erholung'] },
  { wort: 'erstarrt',       q: 'uk', staerke: 3, beduerfnisse: ['Sicherheit', 'Bewegung', 'Halt'] },

  // ---------------------------------------------------------------------
  // angenehm, viel Energie
  // ---------------------------------------------------------------------
  { wort: 'neugierig',      q: 'aa', staerke: 1, beduerfnisse: ['Verständnis', 'Lebendigkeit'] },
  { wort: 'interessiert',   q: 'aa', staerke: 1, beduerfnisse: ['Verständnis', 'Teilhabe'] },
  { wort: 'wach',           q: 'aa', staerke: 1, beduerfnisse: ['Lebendigkeit', 'Erholung'] },
  { wort: 'zuversichtlich', q: 'aa', staerke: 2, beduerfnisse: ['Hoffnung', 'Vertrauen'] },
  { wort: 'hoffnungsvoll',  q: 'aa', staerke: 2, beduerfnisse: ['Hoffnung', 'Sinn'] },
  { wort: 'erleichtert',    q: 'aa', staerke: 2, beduerfnisse: ['Sicherheit', 'Klarheit'] },
  { wort: 'froh',           q: 'aa', staerke: 2, beduerfnisse: ['Verbindung', 'Leichtigkeit'] },
  { wort: 'dankbar',        q: 'aa', staerke: 2, beduerfnisse: ['Verbindung', 'Wertschätzung'] },
  { wort: 'berührt',        q: 'aa', staerke: 2, beduerfnisse: ['Nähe', 'Verbindung'] },
  { wort: 'gerührt',        q: 'aa', staerke: 2, beduerfnisse: ['Nähe', 'Verständnis'] },
  { wort: 'ermutigt',       q: 'aa', staerke: 2, beduerfnisse: ['Unterstützung', 'Hoffnung'] },
  { wort: 'motiviert',      q: 'aa', staerke: 2, beduerfnisse: ['Wirksamkeit', 'Sinn'] },
  { wort: 'lebendig',       q: 'aa', staerke: 3, beduerfnisse: ['Lebendigkeit', 'Sinn'] },
  { wort: 'begeistert',     q: 'aa', staerke: 3, beduerfnisse: ['Lebendigkeit', 'Teilhabe'] },
  { wort: 'glücklich',      q: 'aa', staerke: 3, beduerfnisse: ['Verbindung', 'Sinn'] },
  { wort: 'überwältigt',    q: 'aa', staerke: 3, beduerfnisse: ['Nähe', 'Verbindung'] },
  { wort: 'stolz',          q: 'aa', staerke: 3, beduerfnisse: ['Wirksamkeit', 'Anerkennung'] },

  // ---------------------------------------------------------------------
  // angenehm, wenig Energie
  // ---------------------------------------------------------------------
  { wort: 'ruhig',          q: 'ak', staerke: 1, beduerfnisse: ['Ruhe', 'Sicherheit'] },
  { wort: 'gelassen',       q: 'ak', staerke: 1, beduerfnisse: ['Ruhe', 'Vertrauen'] },
  { wort: 'entspannt',      q: 'ak', staerke: 1, beduerfnisse: ['Erholung', 'Ruhe'] },
  { wort: 'gefasst',        q: 'ak', staerke: 1, beduerfnisse: ['Halt', 'Klarheit'] },
  { wort: 'zufrieden',      q: 'ak', staerke: 2, beduerfnisse: ['Sinn', 'Wirksamkeit'] },
  { wort: 'versöhnlich',    q: 'ak', staerke: 2, beduerfnisse: ['Verbindung', 'Frieden'] },
  { wort: 'geborgen',       q: 'ak', staerke: 2, beduerfnisse: ['Sicherheit', 'Nähe', 'Zugehörigkeit'] },
  { wort: 'verbunden',      q: 'ak', staerke: 2, beduerfnisse: ['Verbindung', 'Zugehörigkeit'] },
  { wort: 'getröstet',      q: 'ak', staerke: 2, beduerfnisse: ['Trost', 'Nähe'] },
  { wort: 'sicher',         q: 'ak', staerke: 2, beduerfnisse: ['Sicherheit', 'Vertrauen'] },
  { wort: 'klar',           q: 'ak', staerke: 2, beduerfnisse: ['Klarheit', 'Orientierung'] },
  { wort: 'still',          q: 'ak', staerke: 2, beduerfnisse: ['Ruhe', 'Erholung'] },
  { wort: 'friedlich',      q: 'ak', staerke: 3, beduerfnisse: ['Frieden', 'Ruhe'] },
  { wort: 'erfüllt',        q: 'ak', staerke: 3, beduerfnisse: ['Sinn', 'Verbindung'] },
  { wort: 'angenommen',     q: 'ak', staerke: 3, beduerfnisse: ['Annahme', 'Zugehörigkeit'] },
  // Nachtrag aus der EKE-Gefühlsliste.
  { wort: 'mitfühlend',     q: 'ak', staerke: 1, beduerfnisse: ['Verbindung', 'Verständnis'] },
  { wort: 'zugehörig',      q: 'ak', staerke: 2, beduerfnisse: ['Zugehörigkeit', 'Verbindung'] },
  { wort: 'vertrauensvoll', q: 'ak', staerke: 2, beduerfnisse: ['Vertrauen', 'Verlässlichkeit'] }
];

// ---------------------------------------------------------------------------
// Pseudogefühle
// ---------------------------------------------------------------------------
// Wörter, die wie ein Gefühl klingen, aber beschreiben, was jemand anderes
// angeblich tut. Sie stehen NICHT in der Liste oben. Wer eines eingibt,
// bekommt die echten Gefühle angeboten, die dahinterstecken können.
//
// Bewusst mehrere Treffer je Eintrag: Welches zutrifft, weiß nur die Person
// selbst. Das Werkzeug schlägt vor, es entscheidet nicht.

const PSEUDOGEFUEHLE = {
  'hintergangen':      ['misstrauisch', 'enttäuscht', 'verunsichert', 'wütend'],
  'betrogen':          ['misstrauisch', 'enttäuscht', 'gekränkt'],
  'verraten':          ['enttäuscht', 'misstrauisch', 'traurig'],
  'ignoriert':         ['einsam', 'traurig', 'unsicher', 'ärgerlich'],
  'übergangen':        ['ohnmächtig', 'ärgerlich', 'gekränkt'],
  'nicht gesehen':     ['einsam', 'traurig', 'gekränkt'],
  'nicht gehört':      ['frustriert', 'ohnmächtig', 'ärgerlich'],
  'verletzt':          ['traurig', 'gekränkt', 'bedrückt'],
  'abgelehnt':         ['traurig', 'einsam', 'unsicher'],
  'zurückgewiesen':    ['traurig', 'einsam', 'gekränkt'],
  'ausgeschlossen':    ['einsam', 'traurig', 'ohnmächtig'],
  'im stich gelassen': ['einsam', 'hilflos', 'enttäuscht'],
  'vernachlässigt':    ['einsam', 'traurig', 'sehnsüchtig'],
  'angegriffen':       ['wütend', 'verunsichert', 'alarmiert'],
  'bedroht':           ['alarmiert', 'panisch', 'besorgt'],
  'unter druck gesetzt': ['angespannt', 'überfordert', 'gereizt'],
  'manipuliert':       ['misstrauisch', 'wütend', 'verunsichert'],
  'benutzt':           ['wütend', 'enttäuscht', 'gekränkt'],
  'ausgenutzt':        ['ärgerlich', 'enttäuscht', 'erschöpft'],
  'kontrolliert':      ['gereizt', 'ohnmächtig', 'angespannt'],
  'bevormundet':       ['gereizt', 'ärgerlich', 'ohnmächtig'],
  'missverstanden':    ['frustriert', 'einsam', 'ratlos'],
  'unverstanden':      ['einsam', 'frustriert', 'traurig'],
  'provoziert':        ['gereizt', 'wütend', 'angespannt'],
  'gedemütigt':        ['beschämt', 'wütend', 'gekränkt'],
  'erpresst':          ['ohnmächtig', 'wütend', 'angespannt'],
  'ersetzt':           ['traurig', 'einsam', 'verunsichert'],
  'ausgegrenzt':       ['einsam', 'traurig', 'ärgerlich'],
  'entmündigt':        ['ohnmächtig', 'wütend', 'frustriert'],
  'schlechtgemacht':   ['gekränkt', 'wütend', 'traurig'],
  'ausgeliefert':      ['ohnmächtig', 'hilflos', 'panisch'],
  'überrumpelt':       ['überfordert', 'verunsichert', 'ärgerlich'],
  'im regen stehen gelassen': ['hilflos', 'enttäuscht', 'einsam'],

  // Nachtrag aus der EKE-Gefühlsliste. "verlassen" stand hier zuerst
  // fälschlich unter den echten Gefühlen: "Du hast mich verlassen" ist eine
  // Handlung des Gegenübers, kein Zustand in mir. Das echte Gefühl ist einsam.
  'verlassen':         ['einsam', 'traurig', 'verzweifelt'],
  'bloßgestellt':      ['beschämt', 'wütend', 'ohnmächtig'],
  'nicht ernst genommen': ['ärgerlich', 'enttäuscht', 'einsam', 'ohnmächtig'],
  'ungeliebt':         ['traurig', 'einsam', 'sehnsüchtig'],
  'ausgebootet':       ['wütend', 'ohnmächtig', 'einsam'],
  'abgeschoben':       ['traurig', 'einsam', 'ärgerlich'],
  'kleingemacht':      ['beschämt', 'wütend', 'entmutigt'],
  'im unklaren gelassen': ['verunsichert', 'ärgerlich', 'beunruhigt'],
  'ausgegrenzt worden': ['einsam', 'traurig', 'wütend'],
  'zum schweigen gebracht': ['ohnmächtig', 'wütend', 'frustriert']
};

// Brücke zwischen der Sprache, in der Menschen suchen, und der Form, in der
// die Wörter hier stehen müssen. Gefühlslisten sind fast immer in Hauptwörtern
// geschrieben ("Ohnmacht", "Trauer"), die Maschine braucht aber "ohnmächtig".
// Links steht, was jemand eintippt, rechts der Eintrag, der gemeint ist —
// entweder ein echtes Gefühl oder ein Pseudogefühl.
const SYNONYME = {
  // Trauer und Verlust
  'trauer': 'traurig', 'seelenschmerz': 'traurig', 'leere': 'leer',
  'verlorenheit': 'verloren', 'verlassenheit': 'verlassen',
  'einsamkeit': 'einsam', 'sehnsucht': 'sehnsüchtig', 'vermissen': 'sehnsüchtig',
  'wehmut': 'wehmütig', 'fassungslosigkeit': 'fassungslos',

  // Wut und Kränkung
  'wut': 'wütend', 'zorn': 'zornig', 'gereiztheit': 'gereizt',
  'empörung': 'empört', 'groll': 'verbittert', 'bitterkeit': 'verbittert',
  'verbitterung': 'verbittert', 'kränkung': 'gekränkt', 'demütigung': 'gedemütigt',

  // Ohnmacht und Erschöpfung
  'ohnmacht': 'ohnmächtig', 'hilflosigkeit': 'hilflos',
  'ausgeliefertsein': 'ausgeliefert', 'überforderung': 'überfordert',
  'frustration': 'frustriert', 'mutlosigkeit': 'mutlos',
  'resignation': 'resigniert', 'erschöpfung': 'erschöpft',
  'verzweiflung': 'verzweifelt', 'sinnlosigkeit': 'leer',

  // Angst und Unsicherheit
  'angst': 'ängstlich', 'sorge': 'besorgt', 'verlustangst': 'ängstlich',
  'zukunftsangst': 'ängstlich', 'unsicherheit': 'unsicher',
  'misstrauen': 'misstrauisch', 'argwohn': 'misstrauisch',
  'daueranspannung': 'angespannt', 'anspannung': 'angespannt',
  'alarmbereitschaft': 'alarmiert', 'beklemmung': 'beklommen',

  // Scham und Schuld
  'scham': 'beschämt', 'fremdscham': 'beschämt', 'schuldgefühl': 'schuldig',
  'reue': 'schuldig', 'selbstvorwürfe': 'schuldig', 'selbstzweifel': 'unsicher',
  'versagensgefühl': 'beschämt', 'bloßgestelltsein': 'bloßgestellt',
  'peinlichkeitsgefühl': 'beschämt',

  // Zerrissenheit
  'zerrissenheit': 'zerrissen', 'loyalitätskonflikt': 'zerrissen',
  'ambivalenz': 'zerrissen', 'verwirrung': 'verwirrt',
  'orientierungslosigkeit': 'ratlos', 'orientierungslos': 'ratlos',
  'fremdheit': 'fremd', 'fremdeln': 'fremd', 'taubheit': 'betäubt',
  'betäubung': 'betäubt', 'erstarrung': 'erstarrt',

  // Ablehnung und Distanz
  'genervtsein': 'genervt', 'abneigung': 'genervt', 'widerwille': 'genervt',
  'gleichgültigkeit': 'gleichgültig',

  // Ungerechtigkeit
  'unverstandensein': 'unverstanden', 'übergangenwerden': 'übergangen',
  'unsichtbarkeit': 'übergangen', 'ausgeschlossensein': 'ausgeschlossen',
  'zurückgewiesensein': 'zurückgewiesen', 'enttäuschung': 'enttäuscht',
  'verratensein': 'verraten', 'eifersucht': 'eifersüchtig',

  // Kontakt und Wiederannäherung
  'nervosität': 'nervös', 'befangenheit': 'befangen', 'unbehagen': 'unbehaglich',
  'vorsicht': 'vorsichtig', 'zurückhaltung': 'vorsichtig',
  'vorfreude': 'gespannt', 'überwältigung': 'überwältigt',

  // Tragende Gefühle
  'liebe': 'verbunden', 'verbundenheit': 'verbunden',
  'zugehörigkeit': 'zugehörig', 'vertrauen': 'vertrauensvoll',
  'hoffnung': 'hoffnungsvoll', 'zuversicht': 'zuversichtlich',
  'erleichterung': 'erleichtert', 'freude': 'froh', 'dankbarkeit': 'dankbar',
  'mitgefühl': 'mitfühlend', 'versöhnungsbereitschaft': 'versöhnlich',
  'geborgenheit': 'geborgen', 'ruhe': 'ruhig', 'gelassenheit': 'gelassen'
};

const QUADRANTEN = {
  ua: { angenehm: false, energie: 'viel',  titel: 'unangenehm, viel Energie' },
  aa: { angenehm: true,  energie: 'viel',  titel: 'angenehm, viel Energie' },
  uk: { angenehm: false, energie: 'wenig', titel: 'unangenehm, wenig Energie' },
  ak: { angenehm: true,  energie: 'wenig', titel: 'angenehm, wenig Energie' }
};

// Liefert die Wörter eines Quadranten, nach Stärke sortiert.
function ausQuadrant(q) {
  return GEFUEHLE.filter(g => g.q === q).sort((a, b) => a.staerke - b.staerke);
}

// Sucht ein Wort, egal ob echtes Gefühl oder Pseudogefühl.
// Rückgabe: {art: 'gefuehl', treffer} oder {art: 'pseudo', wort, vorschlaege}
// oder {art: 'aehnlich', treffer} oder {art: 'unbekannt'}.
function suche(eingabe) {
  var e = String(eingabe || '').trim().toLowerCase()
    .replace(/^(ich )?(bin|fühle mich|fuehle mich|habe|empfinde)\s+/i, '')
    .replace(/[.!?,;]+$/, '');
  if (!e) return { art: 'unbekannt' };

  // Hauptwortform und Nebenformen auf den Eintrag zurückführen, der gemeint ist.
  if (SYNONYME[e]) e = SYNONYME[e];

  const treffer = GEFUEHLE.find(g => g.wort.toLowerCase() === e);
  if (treffer) return { art: 'gefuehl', treffer };

  if (PSEUDOGEFUEHLE[e]) {
    return {
      art: 'pseudo',
      wort: e,
      vorschlaege: PSEUDOGEFUEHLE[e].map(w => GEFUEHLE.find(g => g.wort === w)).filter(Boolean)
    };
  }

  const teil = GEFUEHLE.filter(g => g.wort.toLowerCase().startsWith(e.slice(0, 4)));
  if (teil.length) return { art: 'aehnlich', treffer: teil };

  return { art: 'unbekannt' };
}

// Dieselbe Datei läuft an zwei Orten: in Node für den Selbsttest unten,
// im Browser als <script> für die Gefühlsmaschine. Darum beide Wege.
const WORTSCHATZ = { GEFUEHLE, PSEUDOGEFUEHLE, SYNONYME, QUADRANTEN, ausQuadrant, suche };
if (typeof module !== 'undefined' && module.exports) module.exports = WORTSCHATZ;
if (typeof window !== 'undefined') window.GFK_WORTSCHATZ = WORTSCHATZ;

// ---------------------------------------------------------------------------
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  let fehler = 0;
  const melde = (ok, text) => { if (!ok) { fehler++; console.log('FEHLER  ' + text); } };

  console.log(`${GEFUEHLE.length} Gefühlswörter, ${Object.keys(PSEUDOGEFUEHLE).length} Pseudogefühle\n`);

  for (const [q, info] of Object.entries(QUADRANTEN)) {
    const n = ausQuadrant(q);
    console.log(`${info.titel.padEnd(28)} ${String(n.length).padStart(2)} Wörter   ${n.slice(0, 4).map(g => g.wort).join(', ')} ...`);
    melde(n.length >= 12, `${q} hat nur ${n.length} Wörter, mindestens 12 nötig`);
  }
  console.log('');

  const gesehen = new Set();
  for (const g of GEFUEHLE) {
    melde(!gesehen.has(g.wort), `doppelt: ${g.wort}`);
    gesehen.add(g.wort);
    melde(/^[a-zäöüß]+$/.test(g.wort), `Form passt nicht zu "ich bin ...": ${g.wort}`);
    melde(!!QUADRANTEN[g.q], `unbekannter Quadrant bei ${g.wort}`);
    melde([1, 2, 3].includes(g.staerke), `Stärke ungültig bei ${g.wort}`);
    melde(g.beduerfnisse.length >= 2, `zu wenige Bedürfnisse bei ${g.wort}`);
    melde(!PSEUDOGEFUEHLE[g.wort], `${g.wort} steht in beiden Listen`);
  }

  for (const [pseudo, ziele] of Object.entries(PSEUDOGEFUEHLE)) {
    melde(ziele.length >= 3, `${pseudo} hat nur ${ziele.length} Vorschläge`);
    for (const z of ziele) melde(gesehen.has(z), `${pseudo} verweist auf unbekanntes Wort: ${z}`);
  }

  for (const [von, nach] of Object.entries(SYNONYME)) {
    melde(gesehen.has(nach) || !!PSEUDOGEFUEHLE[nach],
      `Synonym "${von}" zeigt auf "${nach}", das es nirgends gibt`);
    melde(!gesehen.has(von) && !PSEUDOGEFUEHLE[von],
      `Synonym "${von}" ist selbst schon ein Eintrag und verdeckt ihn`);
  }
  console.log(`${Object.keys(SYNONYME).length} Synonyme geprüft.\n`);

  console.log('Stichproben der Suche:');
  for (const e of ['hintergangen', 'ich fühle mich hintergangen', 'Ohnmacht', 'Trauer', 'Verlassenheit', 'Zerrissenheit', 'mutlos', 'traur', 'Blumenkohl']) {
    const r = suche(e);
    const text = r.art === 'gefuehl' ? r.treffer.wort
      : r.art === 'pseudo' ? 'Pseudogefühl, führt zu ' + r.vorschlaege.map(g => g.wort).join(', ')
      : r.art === 'aehnlich' ? 'ähnlich: ' + r.treffer.map(g => g.wort).join(', ')
      : 'nicht gefunden';
    console.log(`  ${('"' + e + '"').padEnd(34)} ${r.art.padEnd(10)} ${text}`);
  }

  console.log('');
  console.log(fehler === 0 ? 'Wortliste in sich stimmig.' : `${fehler} Probleme gefunden.`);
  process.exit(fehler === 0 ? 0 : 1);
}
