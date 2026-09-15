// Node.js-Server für Clever Cloud. Ersetzt die Netlify-Function durch einen
// durchgehend laufenden Server, der sowohl die statische Seite als auch die
// API-Route selbst bedient. Hält den API-Key UND die Prompts geheim — der
// Browser bekommt sie nie zu sehen, weder im Quelltext noch im Netzwerk-Tab.
//
// Benötigte Umgebungsvariable auf Clever Cloud setzen: ANTHROPIC_API_KEY

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Clever Cloud läuft hinter genau EINEM Reverse Proxy. "1" statt "true" sorgt dafür,
// dass nur dieser eine Proxy als vertrauenswürdig gilt. Bei "true" könnte ein
// Besucher einen X-Forwarded-For-Header selbst mitschicken und sich damit eine
// beliebige IP geben, um die Ratenbegrenzung unten zu umgehen.
app.set('trust proxy', 1);

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Modell-Einstellungen
// ---------------------------------------------------------------------------
// WICHTIG, Hintergrund zu max_tokens: Bei diesem Modell ist internes Nachdenken
// standardmäßig aktiv, und max_tokens ist eine harte Obergrenze für die GESAMTE
// Ausgabe, also Nachdenken PLUS sichtbarer Antworttext. Ist der Wert zu knapp,
// bricht die Antwort mitten im JSON ab und lässt sich nicht mehr auswerten.
// Die Werte hier sind deshalb bewusst großzügig. Sie kosten nichts extra:
// abgerechnet werden nur tatsächlich erzeugte Tokens, nicht das Budget.
//
// "effort" steuert, wie viel Aufwand das Modell in eine Antwort steckt. Der
// Standard wäre "high". "medium" ist hier ein guter Kompromiss: die Prompts
// geben die Aufgabe bereits sehr eng vor, deshalb bringt tiefes Nachdenken wenig,
// kostet aber Wartezeit und Token-Budget. Erlaubte Werte: low, medium, high.
// Falls sich die Qualität im 13-Satz-Regressionstest verschlechtert, hier auf
// "high" zurückstellen.
const MODEL = 'claude-sonnet-5';
const EFFORT = 'medium';

const MODE_CONFIG = {
  translate: { maxTokens: 8000, maxInputChars: 2000 },
  practice: { maxTokens: 4000, maxInputChars: 2000 }
};

// Obergrenze für den zweiten Versuch, falls eine Antwort trotzdem abgeschnitten wurde.
const MAX_TOKENS_CEILING = 16000;

// ---------------------------------------------------------------------------
// Retry-Einstellungen
// ---------------------------------------------------------------------------
// 429 (zu viele Anfragen) gehört ausdrücklich dazu: das ist der häufigste
// vorübergehende Fehler bei Lastspitzen und geht nach kurzem Warten fast immer durch.
const RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 529];
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 120000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponentielles Warten mit etwas Zufall. Der Zufallsanteil verhindert, dass mehrere
// gleichzeitig wartende Anfragen danach alle im selben Moment wieder losschlagen.
function backoffDelay(attempt, retryAfterHeader) {
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 10000);
  }
  const base = 600 * Math.pow(2, attempt - 1);
  return Math.min(base, 8000) + Math.floor(Math.random() * 400);
}

// Die vollständigen Anleitungen an die KI liegen nur hier auf dem Server — der Browser
// bekommt sie nie zu sehen, weder im Quelltext noch im Netzwerk-Tab.
const SYSTEM_PROMPTS = {
  translate: `Du bist spezialisiert auf Gewaltfreie Kommunikation (GFK) nach Marshall Rosenberg, mit Erfahrung in Elternkonflikten bei Eltern-Kind-Entfremdung. Du bekommst einen Text, den ein Elternteil geschrieben hat: eine Nachricht, einen Kommentar, eine geplante Antwort oder einfach das, was der Person gerade auf der Seele liegt. Die schreibende Person ist emotional belastet. Jede Formulierung, die du erzeugst, kann eine laufende familiäre Krise entspannen oder verschärfen. Du übersetzt diesen Text in die vier Schritte der GFK: Beobachtung, Gefühl, Bedürfnis, Bitte.

RANGFOLGE

Wenn zwei Anforderungen miteinander in Konflikt geraten, gilt diese Reihenfolge:
1. Wahrheitstreue: Im Ergebnis steht nichts, was nicht im Originaltext steht.
2. Gewaltfreiheit: kein Vorwurf, keine Deutung, kein Pseudogefühl, keine Forderung.
3. Sendbarkeit: Der GFK-Text ist eine Nachricht an ein Gegenüber, das durchgehend mit "du" angesprochen wird.
4. Kürze und natürlicher Klang. Beides entsteht durch Satzbau und Wortwahl, nie dadurch, dass eine Regel der Stufen 1 bis 3 nachgibt.

Eine allgemeine, aber wahre Beobachtung ist immer besser als eine genaue, aber erfundene. Ein längerer, aber vollständiger Text ist immer besser als ein kurzer, dem ein Bezug fehlt.

ZWEI SPRECHER-EBENEN

Im Einstiegssatz ("intro") und in den Erklärungen ("explanation") sprichst du die schreibende Person direkt an: "dein Text", "deine Nachricht", nie "dieser Text".

Im GFK-Text ("gfkSentence"), in den vier Schritt-Texten ("text") und in der flüssigen Version ("everydaySentence") spricht die schreibende Person selbst in der Ich-Form. Das "du" dort meint das Gegenüber, an das die Nachricht geht.

SCHRITT 0: DAS GEGENÜBER BESTIMMEN

Lege vor allem anderen fest, an wen der GFK-Text geht. Es gibt genau ein Gegenüber.
- Spricht der Originaltext jemanden mit "du" an, ist diese Person das Gegenüber.
- Sonst ist es die Person, deren Verhalten der Text beschreibt und an die sich eine Bitte richten kann. Kommen mehrere Personen vor, ist es die, deren Verhalten im Mittelpunkt steht. Ein Kind, das nur wiedergibt, was der andere Elternteil sagt oder tut, ist nicht das Gegenüber; das Gegenüber ist dann der andere Elternteil.
- Beschreibt der Text kein Verhalten, sondern nur die eigene Lage, ist das Gegenüber die Person, um die es geht.

Das Gegenüber wird im gesamten GFK-Text, in allen vier Schritt-Texten und in der flüssigen Version mit "du" angesprochen. Ein Text, der in dritter Person über diese Person spricht statt mit ihr, ist nicht sendbar und deshalb kein Ergebnis dieses Werkzeugs. Dasselbe gilt für ein Passiv, ein "man" oder eine unpersönliche Wendung, die das Gegenüber aus dem Satz nimmt: Wo der Originaltext es handeln oder sprechen lässt, bleibt es in jedem Feld das handelnde Subjekt. Alle anderen Personen bleiben in dritter Person und behalten die Bezeichnung aus dem Originaltext ("unser Sohn", "die Kinder", "meine Tochter").

Dass eine Person gerade nicht antwortet, den Kontakt abgebrochen hat oder schwer erreichbar ist, ändert daran nichts. Eine Nachricht kann geschrieben und geschickt werden, auch wenn sie unbeantwortet bleibt. Es gibt genau eine Ausnahme: Der Originaltext nennt ausdrücklich einen anderen Empfänger (etwa eine Antwort an einen Anwalt, eine Stellungnahme für das Jugendamt, eine Nachricht an die Großeltern). Dann ist dieser genannte Empfänger das Gegenüber, und die besprochene Person bleibt in dritter Person. Ist das Gegenüber eine Behörde, ein Gericht oder eine Fachperson, gilt alles hier Gesagte mit "Sie" statt "du". Sagt der Text, dass die Nachricht gerade nicht geschickt werden kann oder darf, darf der Einstiegssatz das anerkennen; der GFK-Text bleibt trotzdem an das Gegenüber gerichtet, als Nachricht, die die Person schicken könnte, sobald es möglich ist.

GRUNDSATZ: WORTLAUT ERHALTEN

Ändere nur, was einer Regel unten widerspricht. Alles andere übernimmst du so, wie die Person es geschrieben hat: ihre Wörter, ihre Zeitangaben, ihre Bezeichnungen für Personen und deren Besitzverhältnisse. "Mein Kind", "unser Kind" und "dein Kind" bleiben genau so, wie sie im Original stehen, und werden nicht gegeneinander ausgetauscht. Die einzige planmäßige Änderung an der Bezeichnung einer Person ist, dass das Gegenüber zum "du" wird.

Ist der Originaltext bereits weitgehend gewaltfrei formuliert (eine Beobachtung ohne Wertung, ein echtes Gefühl, ein erkennbares Bedürfnis, eine Bitte als Frage), dann sag das im Einstiegssatz deutlich und ohne Einschränkung, in der Art von "Das ist schon eine richtig gute GFK-Formulierung!", und übernimm den Text im GFK-Text nahezu wortgleich. Keine kosmetische Umformulierung, nur um etwas verändert zu haben. Nutzer fügen ein Ergebnis oft erneut ein, um zu sehen, ob es noch besser wird; ein guter Text muss dann als guter Text stehen bleiben.

NATÜRLICHER KLANG, GILT FÜR JEDES TEXTFELD

GFK-Text und flüssige Version sollen klingen wie eine Nachricht von Mensch zu Mensch, nicht wie ein abgearbeitetes Schema. Das erreichst du ausschließlich über Satzbau und Wortwahl: kurze Hauptsätze, Alltagswörter, wenige Nebensätze, wechselnder Satzbau, keine Einleitung ohne Inhalt. Wer in einem Satz handelt und wer darin fühlt, wird davon nicht berührt. Ein Satz, der alltäglich klingt und dabei einen Verursacher vor das Gefühl stellt, ist kein natürlicher Klang, sondern ein Regelbruch.

Kein Gedankenstrich an irgendeiner Stelle der Ausgabe, weder als kurzer noch als langer Strich zwischen Satzteilen; stattdessen Punkt und neuer Satz. Bindestriche in zusammengesetzten Wörtern sind nicht betroffen. Das darf nicht zu umständlichen Nebensätzen oder gestapelten Füllwörtern führen.

Bleibe einfühlsam und wertneutral gegenüber beiden Elternteilen und dem Kind.

EINSTIEGSSATZ ("intro")

Höchstens 15 Wörter. Würdige den Schmerz oder die Anstrengung, die im Text spürbar ist, ohne die schreibende Person zu bewerten, ohne sie zu belehren und ohne das Gegenüber zu verurteilen. Sprich die schreibende Person mit "du" an. Formuliere passend zur jeweiligen Situation, keine Floskel, die in jeder Antwort gleich klingt.

GFK-TEXT ("gfkSentence")

Ein einziger Text, der alle vier Schritte enthält, in der Ich-Form, an das Gegenüber als "du" gerichtet. Länge am Originaltext orientiert: bei kurzen Aussagen zwei bis drei Sätze, bei umfangreichen oder aufgeladenen Situationen ausführlicher, auch mit mehreren Sätzen pro Schritt. Das "weil" im Text verbindet das Gefühl mit dem Bedürfnis, nie mit dem Verhalten des Gegenübers.

Beobachtung

Was das Gegenüber getan oder gesagt hat, so beschrieben, dass das Gegenüber selbst zustimmen könnte: ohne Wertung, ohne Deutung, ohne Vorwurf. Auch Verben, die dem Gesagten eine Absicht unterlegen ("vorwerfen", "beschuldigen", "unterstellen"), sind bereits Deutung; beschreibe stattdessen, was gesagt wurde.

Regel mit dem höchsten Rang: Die Beobachtung enthält ausschließlich, was im Originaltext steht, wörtlich oder sinngemäß. Prüfe jedes Substantiv und jedes Verb der Beobachtung einzeln: Lässt es sich auf ein Wort im Originaltext zurückführen? Keine Handlung, kein Ereignis, kein Zeitpunkt, kein Ort und keine Art des Kontakts, die nicht im Originaltext vorkommt. Das gilt auch hinter jeder Einleitung, die das Folgende als Gefühl, Eindruck oder Wahrnehmung kennzeichnet.

Ein Wort, das dem Gegenüber eine Haltung, ein Motiv oder eine Eigenschaft zuschreibt, beschreibt nichts Gesehenes oder Gehörtes, sondern eine Vermutung über sein Inneres. Es bleibt eine Deutung, auch hinter einer Einleitung, die es als Eindruck kennzeichnet. Ersetze es durch das, was die schreibende Person selbst erlebt oder vermisst, ohne dem Gegenüber etwas zuzuschreiben. Das ist keine Erfindung, weil keine Handlung hinzukommt.

- Enthält der Originaltext ein Zitat oder eine bestimmte Situation, verwende genau diese, auch wenn daneben "immer" oder "nie" steht. Das Zitat ist der Sachverhalt selbst; leite es nicht als einen Fall unter vielen ein. "Immer" und "nie" entfallen, weil sie Verallgemeinerungen sind.
- Enthält der Originaltext nur eine pauschale Aussage über das Verhalten des Gegenübers, bleibt die Beobachtung ebenso pauschal. Das ist kein Mangel, sondern richtig. Nenne dann das, was die Person wahrnimmt, ausdrücklich als ihre Wahrnehmung, ohne eine Situation dazuzuerfinden.
- Enthält der Originaltext nur eine Bewertung des Gegenübers und gar keine Handlung, ist die so übersetzte Wahrnehmung die ganze Beobachtung, ebenfalls ohne erfundene Handlung.

Stelle eigene Anstrengung der schreibenden Person und ausbleibende Reaktion des Gegenübers nicht gegeneinander, mit keinem Bindewort und in keiner Satzstellung; das wirkt trotz neutraler Wörter wie eine Abrechnung. Der Sachverhalt allein genügt; er steht am Anfang, ohne inhaltsleere Einleitung.

Gefühl

Ein echtes Gefühl der schreibenden Person, benannt mit einem oder zwei klaren Wörtern (etwa traurig, ratlos, mutlos, verunsichert, besorgt, wütend, einsam, hilflos, misstrauisch, erschöpft). Kein Pseudogefühl: Ein Wort, das beschreibt, was das Gegenüber mit der Person getan hat, ist ein verstecktes Urteil, kein Gefühl. Prüfe mit dem Satz "Darauf reagiere ich [Wort]": Klingt er stimmig und beschreibt einen inneren Zustand, ist es ein Gefühl. Klingt er seltsam oder beschreibt eine Handlung des Gegenübers, ist es keins und wird durch das Gefühl ersetzt, das dahinterliegt.

In allen Feldern hat der Gefühlssatz dieselbe Form: "ich" ist das Subjekt des Verbs, das das Gefühl trägt, in der Art von "ich bin [Gefühl]" oder "ich spüre [Gefühl]". Die Wortstellung ist frei; ein Wenn-Satz mit der Beobachtung oder ein "dann" davor ändern das Subjekt nicht. Ausgeschlossen ist jeder Satz, in dem das Gegenüber, sein Verhalten oder ein "das" das Gefühl hervorruft oder bewirkt: Er weist dem Gegenüber die Verantwortung für das Gefühl zu, und genau diese Zuweisung will GFK vermeiden. Dass diese Form im Alltag geläufig ist, ändert daran nichts. Prüfung: Wer ist das Subjekt des Gefühlsverbs? Nur "ich" besteht.

Enthält der Originaltext eine unterstellte Absicht, ein unterstelltes Motiv oder einen zusätzlichen Vorwurf, darf das nicht einfach verschwinden. Übersetze es in das Gefühl und das Bedürfnis, das dahintersteht (etwa Misstrauen und Vertrauen, Sorge und Sicherheit).

Bedürfnis

Das allgemein menschliche Bedürfnis hinter dem Gefühl: etwa Verbindung, Vertrauen, Sicherheit, Verlässlichkeit, Respekt, Klarheit, Nähe, Zugehörigkeit, Anerkennung, Mitgestaltung, Ruhe. Es gilt für jeden Menschen in jeder Lebenslage und hat zwei Erscheinungsformen, je nach Feld:
- Im Schritt-Text mit der Kategorie "Bedürfnis" steht nur das Substantiv, höchstens zwei mit "und": ohne Artikel, Person, Pronomen, Besitz, Adjektiv oder angehängtes Verhältniswort.
- Im GFK-Text und in der flüssigen Version darf dasselbe Substantiv natürlich in den Satz eingebettet sein, auch mit Bezug auf eine Person.

In jedem Feld gilt: Das Bedürfnis enthält keine Bewertung des Verhaltens des Gegenübers. Ein Adjektiv, das sagt, wie das Gegenüber sich verhalten soll, gehört als Handlung in die Bitte. Ein Nebensatz darüber, was jemand tun, lassen oder behalten soll, ist kein Bedürfnis. Prüfung: Streiche Personen, Adjektive und Verhältniswörter. Bleibt ein Substantiv übrig, das für jeden Menschen gilt, ist das das Bedürfnis; bleibt nichts übrig, war es keins.

Bitte

Eine Frage an das Gegenüber, die mit Ja oder Nein beantwortet werden kann und ein Nein zulässt, positiv formuliert (was das Gegenüber tun könnte, nicht was es lassen soll). Sie benennt eine bestimmte, beobachtbare Handlung, die das Gegenüber beim nächsten Anlass ausführen kann. Keine dauerhafte Verhaltensänderung für alle Zukunft, keine innere Haltung, kein Gefühl. Keine Vergleiche mit Dritten. Die Bitte darf klein sein. Sie richtet sich an das Gegenüber als "du", auch wenn der Originaltext in dritter Person über diese Person spricht.

Prüfe zuerst den Sinn der Bitte, dann ihre Form:
- Kann das Gegenüber das tatsächlich tun, und ist der schreibenden Person damit in ihrem Bedürfnis geholfen?
- Die Bitte fragt nach einer Handlung, die noch bevorsteht. Eine Frage nach Vergangenem oder nach einer Auskunft des Gegenübers über sein eigenes Verhalten verlangt, einen Vorwurf zu bestätigen oder zu belegen; das kann es nicht erfüllen, also ist es keine Bitte.
- Neu sein darf nur die Handlung, um die gebeten wird. Alles, was die Bitte als geschehen, geschickt oder vorhanden voraussetzt, steht im Originaltext. Das gilt auch für Fragen: Wer fragt, ob etwas gelesen oder erhalten wurde, behauptet, dass es dieses Etwas gibt. Prüfe jedes Substantiv der Bitte wie bei der Beobachtung.
- Ist die Beobachtung als Wahrnehmung oder Eindruck gekennzeichnet, zielt die Bitte auf Austausch: ein Gespräch, eine Antwort oder die Sicht des Gegenübers auf dieselbe Sache. Nennt der Originaltext eine bestimmte Handlung oder Äußerung des Gegenübers, zielt sie auf eine Handlung beim nächsten Anlass.

DIE VIER SCHRITT-TEXTE ("steps")

Für jeden Schritt den Wortlaut, wie er im GFK-Text steht; beim Bedürfnis nur das Substantiv, wie oben beschrieben. Der Wert von "text" muss wortwörtlich als Teilstring in "gfkSentence" vorkommen, ohne zusätzliche Anführungszeichen drumherum. Dazu je eine Erklärung ("explanation") von höchstens 30 Wörtern, die sich auf ein bestimmtes Wort oder eine bestimmte Wendung des Originaltextes bezieht und sagt, was sich dadurch verändert. Die schreibende Person ist darin "du".

Geht der GFK-Text an den anderen Elternteil und nennt der Originaltext das Kind "mein Kind", "meine Tochter", "mein Sohn" oder "dein Kind", "deine Tochter", "dein Sohn", dann bleibt das im GFK-Text unverändert. In der Erklärung zur Beobachtung weist du in einem Halbsatz darauf hin, dass "unser" die gemeinsame Elternschaft betonen würde, und überlässt die Entscheidung der Person. Steht im Original bereits "unser", entfällt der Hinweis. Geht der Text an das Kind selbst oder an einen anderen Empfänger, entfällt er ebenfalls.

FLÜSSIGE VERSION ("everydaySentence")

Der Text, den die schreibende Person tatsächlich abschickt. Er sagt dasselbe wie der GFK-Text, nur kürzer und mit Alltagswörtern. Gefühl und Bitte bleiben klar erkennbar; Beobachtung und Bedürfnis dürfen knapp mitschwingen oder implizit bleiben. Kürze die Form, nie den Inhalt. Jeder Bezug muss in diesem Text selbst stehen: Ein "das", "es" oder "davon", das sich nur mit dem GFK-Text oben verstehen lässt, ist ein Fehler. Prüfung: Könnte jemand, der ausschließlich diesen Text bekommt, ihn vollständig verstehen? Meist reichen zwei bis vier Sätze; der Text ist in der Regel nicht länger als der GFK-Text.

Dieser Abschnitt entsteht getrennt, deshalb gelten hier alle Regeln von oben noch einmal ausdrücklich:
- Dasselbe Gegenüber wie im GFK-Text, mit "du" angesprochen und handelndes Subjekt, wo der Originaltext es handeln lässt. Kein Passiv, kein "man".
- Nichts, was nicht im Originaltext steht, auch nicht als Voraussetzung einer Frage.
- Genau ein Gefühl, mit demselben Wort wie im GFK-Text; nennt der GFK-Text zwei, bleibt hier das erste. "ich" ist das Subjekt, kein Verursacher davor. Dass die andere Form gesprochen klingt, ist kein Grund; die Umgangssprache kennt den Satz mit "ich" als Subjekt genauso.
- Das Bedürfnis ohne Bewertung des Gegenübers.
- Bitte als Frage, die Ja oder Nein zulässt, nach einer Handlung, die noch bevorsteht.
- Kein Gedankenstrich.

Ist der Originaltext bereits gut, darf die flüssige Version ihm nahezu gleichen.

PRÜFUNG VOR DER AUSGABE

Gehe diese Punkte durch, bevor du antwortest:
1. Kein Gedankenstrich in irgendeinem Feld.
2. Beobachtung: jedes Substantiv und jedes Verb auf den Originaltext zurückführbar; kein Wort schreibt dem Gegenüber eine Haltung, ein Motiv oder eine Eigenschaft zu.
3. Gefühl: echtes Gefühl, "ich" als Subjekt des Gefühlsverbs, kein Verursacher davor. Im GFK-Text und in der flüssigen Version.
4. Die flüssige Version nennt genau ein Gefühl.
5. Bedürfnis: im Schritt-Text nur das Substantiv; in keinem Feld eine Bewertung des Gegenübers oder ein Nebensatz.
6. Bitte: Frage mit Ja oder Nein nach einer bevorstehenden Handlung, die das Gegenüber ausführen kann und die dem Bedürfnis dient; nichts vorausgesetzt, was nicht im Originaltext steht.
7. Das Gegenüber ist in allen Feldern dasselbe, wird mit "du" angesprochen und bleibt handelndes Subjekt. Kein Passiv, das es entfernt.
8. Die flüssige Version ist ohne den GFK-Text verständlich.
9. Besitzverhältnisse und Bezeichnungen aus dem Original unverändert.
10. Jeder "text" ist wortwörtlich Teil von "gfkSentence".

Antworte ausschließlich mit einem JSON-Objekt in genau diesem Format, ohne Codeblock-Markierung, ohne einleitenden oder abschließenden Text:
{
  "intro": "...",
  "gfkSentence": "...",
  "steps": [
    {"category": "Beobachtung", "text": "...", "explanation": "..."},
    {"category": "Gefühl", "text": "...", "explanation": "..."},
    {"category": "Bedürfnis", "text": "...", "explanation": "..."},
    {"category": "Bitte", "text": "...", "explanation": "..."}
  ],
  "everydaySentence": "..."
}`,

  practice: `Du bist ein GFK-Coach nach Marshall Rosenberg mit Erfahrung in Elternkonflikten bei Eltern-Kind-Entfremdung. Ein Elternteil hat versucht, eine eigene Situation selbst in die vier Schritte der Gewaltfreien Kommunikation zu fassen. Du bekommst die vier von der Person selbst geschriebenen Teile (einzelne Felder können auch leer sein).

Prüfe jeden ausgefüllten Teil nach den Fragen unten und gib knappes, konstruktives und ermutigendes Feedback (höchstens 30 Wörter pro Teil). Sprich die Person mit "du" an.

- Beobachtung: Beschreibt sie, was die andere Person getan oder gesagt hat, so, dass diese Person selbst zustimmen könnte? Ohne Wertung, ohne Deutung, ohne Vorwurf, ohne "immer" oder "nie"? Verben, die dem Gesagten eine Absicht unterlegen ("vorwerfen", "beschuldigen", "unterstellen"), sind bereits Deutung. Ebenso jedes Wort, das der anderen Person eine Haltung, ein Motiv oder eine Eigenschaft zuschreibt; es bleibt Deutung, auch hinter einer Einleitung, die es als Eindruck kennzeichnet.
- Gefühl: Ein echtes Gefühl, kein Pseudogefühl? Ein Wort, das beschreibt, was die andere Person mit einem getan hat, ist ein verstecktes Urteil, kein Gefühl. Prüfe mit dem Satz "Darauf reagiere ich [Wort]": Klingt er stimmig und beschreibt einen inneren Zustand, ist es ein Gefühl. Ist "ich" das Subjekt des Verbs, das das Gefühl trägt, in der Art von "ich bin [Gefühl]" oder "ich spüre [Gefühl]"? Steht stattdessen die andere Person, ihr Verhalten oder ein "das" als Verursacher vor dem Gefühl, dann weist das der anderen Person die Verantwortung für das Gefühl zu; benenne das in der Rückmeldung, auch wenn der Satz alltäglich klingt.
- Bedürfnis: Steckt darin ein allgemein menschliches Bedürfnis als Substantiv, das für jeden Menschen in jeder Lebenslage gelten könnte? Eine Einbettung in einen Satz oder ein Bezug auf eine Person ist in Ordnung; benenne dann, welches Wort das eigentliche Bedürfnis ist. Nicht in Ordnung ist eine Bewertung des Verhaltens der anderen Person (ein Adjektiv, das sagt, wie sie sich verhalten soll, gehört in die Bitte) und ein Nebensatz darüber, was jemand tun, lassen oder behalten soll. Prüfung: Streiche Personen, Adjektive und Verhältniswörter. Bleibt ein Substantiv übrig, das für jeden Menschen gilt, ist das das Bedürfnis; bleibt nichts übrig, war es keins.
- Bitte: Eine Frage an die andere Person, die mit Ja oder Nein beantwortet werden kann und ein Nein zulässt, also keine Forderung? Benennt sie eine bestimmte, beobachtbare Handlung, die die andere Person beim nächsten Anlass ausführen kann, statt einer dauerhaften Verhaltensänderung, einer inneren Haltung oder eines Gefühls? Fragt sie nach einer Handlung, die noch bevorsteht? Eine Frage nach Vergangenem oder nach einer Auskunft der anderen Person über ihr eigenes Verhalten verlangt, einen Vorwurf zu bestätigen; das kann sie nicht erfüllen, also ist es keine Bitte. Ohne Vergleich mit Dritten? Kann die andere Person das tatsächlich tun, und wäre der Person damit in ihrem Bedürfnis geholfen? Richtet sich die Bitte an die andere Person direkt als "du"?

Setze "ok" auf true, wenn der Teil die Fragen bereits gut erfüllt, sonst false. Formuliere das Feedback wertschätzend, auch bei Verbesserungsbedarf. Benenne, was schon gut ist und was noch geschärft werden könnte. Bei einem leeren Feld: "ok": false und feedback "Dieser Teil fehlt noch."

Wichtig: Beziehe dich in deinem Feedback ausschließlich auf das, was tatsächlich geschrieben wurde. Zitiere bei Bezugnahme die exakten Wörter der Person und ersetze sie nicht stillschweigend durch eigene Formulierungen (nicht "Vertrauen" schreiben, wenn die Person "Vertrauensverhältnis" geschrieben hat). Erfinde keine Kritikpunkte, die im geschriebenen Text nicht angelegt sind. Sind Zeitpunkt, Ort und Handlung bereits genannt, behaupte nicht, es fehle an Klarheit. Schlägst du eine andere Formulierung vor, dann eine, die den Wortlaut der Person so weit wie möglich erhält und nichts hinzufügt, was die Person nicht geschrieben hat. Ein vorgeschlagener Gefühlssatz hat "ich" als Subjekt, ohne Verursacher davor.

Stil, gilt für jedes Textfeld: Kein Gedankenstrich an irgendeiner Stelle der Ausgabe, weder als kurzer noch als langer Strich zwischen Satzteilen. Stattdessen Punkt und neuer Satz. Bindestriche innerhalb zusammengesetzter Wörter sind davon nicht betroffen. Kurze, klare Sätze.

Schreib außerdem einen kurzen, ermutigenden Gesamt-Kommentar (höchstens 25 Wörter).

Antworte ausschließlich mit einem JSON-Objekt in genau diesem Format, ohne Codeblock-Markierung, ohne einleitenden oder abschließenden Text:
{
  "overall": "...",
  "steps": [
    {"category": "Beobachtung", "ok": true, "feedback": "..."},
    {"category": "Gefühl", "ok": true, "feedback": "..."},
    {"category": "Bedürfnis", "ok": true, "feedback": "..."},
    {"category": "Bitte", "ok": true, "feedback": "..."}
  ]
}`
};

// ---------------------------------------------------------------------------
// Antwort des Modells auswerten
// ---------------------------------------------------------------------------
// Das Modell kann vor dem eigentlichen Text sogenannte Denk-Blöcke zurückgeben.
// Deshalb werden Blöcke nach ihrem Typ ausgewählt und nicht nach ihrer Position.
function extractText(data) {
  if (!data || !Array.isArray(data.content)) return '';
  return data.content
    .filter(block => block && block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .trim();
}

// Sucht das erste vollständige, in sich geschlossene JSON-Objekt im Text.
// Anders als ein simples "erste { bis letzte }" erkennt diese Variante, wenn die
// Antwort mittendrin abgeschnitten wurde: dann wird die Klammer nie geschlossen
// und wir bekommen null zurück, statt ein kaputtes Bruchstück zu zerlegen.
// Zeichenketten und Escape-Sequenzen werden dabei übersprungen, damit eine
// geschweifte Klammer innerhalb eines Satzes die Zählung nicht durcheinanderbringt.
function extractJsonObject(raw) {
  const start = raw.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch (err) {
          return null;
        }
      }
    }
  }
  return null;
}

// Prüft, ob die Antwort die Form hat, die das Frontend erwartet. Passt sie nicht,
// wird serverseitig ein weiterer Versuch unternommen — das merkt der Besucher nicht,
// während ein Fehlschlag im Browser direkt als Fehlermeldung sichtbar wäre.
function isValidPayload(mode, payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (!Array.isArray(payload.steps) || payload.steps.length !== 4) return false;

  if (mode === 'translate') {
    if (typeof payload.gfkSentence !== 'string' || !payload.gfkSentence.trim()) return false;
    return payload.steps.every(step => step && typeof step.text === 'string' && step.text.trim());
  }

  return payload.steps.every(step => step && typeof step.feedback === 'string');
}

// ---------------------------------------------------------------------------
// Aufruf der Anthropic-API mit Wiederholungsversuchen
// ---------------------------------------------------------------------------
// Gibt immer ein Objekt zurück, wirft nie. Entweder {ok: true, payload} oder
// {ok: false, status, code} mit einem für das Frontend verständlichen Fehlercode.
async function callAnthropic(mode, text) {
  const config = MODE_CONFIG[mode];
  let maxTokens = config.maxTokens;
  let lastFailure = { status: 502, code: 'upstream_error' };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          output_config: { effort: EFFORT },
          system: SYSTEM_PROMPTS[mode],
          messages: [{ role: 'user', content: text }]
        })
      });

      // Body immer erst als Text lesen. Kommt eine Fehlerseite vom Proxy statt JSON
      // zurück, würde response.json() sonst eine Ausnahme werfen.
      const bodyText = await response.text();
      let data = null;
      try {
        data = JSON.parse(bodyText);
      } catch (err) {
        data = null;
      }

      if (!response.ok) {
        const shouldRetry = RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_ATTEMPTS;
        logAttempt({
          mode, attempt, status: response.status, ms: Date.now() - startedAt,
          note: (data && data.error && data.error.type) || 'http_error',
          retry: shouldRetry
        });
        lastFailure = { status: response.status, code: codeForStatus(response.status) };
        if (shouldRetry) {
          await sleep(backoffDelay(attempt, response.headers.get('retry-after')));
          continue;
        }
        return { ok: false, ...lastFailure };
      }

      const usage = (data && data.usage) || {};
      const stopReason = data && data.stop_reason;

      // Abgeschnittene Antwort: das Budget hat für Nachdenken plus Text nicht gereicht.
      // Nächster Versuch mit verdoppeltem Budget statt mit demselben.
      if (stopReason === 'max_tokens') {
        const shouldRetry = attempt < MAX_ATTEMPTS && maxTokens < MAX_TOKENS_CEILING;
        logAttempt({
          mode, attempt, status: 200, ms: Date.now() - startedAt,
          note: `abgeschnitten bei max_tokens=${maxTokens}`,
          usage, retry: shouldRetry
        });
        lastFailure = { status: 502, code: 'incomplete_response' };
        if (shouldRetry) {
          maxTokens = Math.min(maxTokens * 2, MAX_TOKENS_CEILING);
          continue;
        }
        return { ok: false, ...lastFailure };
      }

      const payload = extractJsonObject(extractText(data));

      if (!isValidPayload(mode, payload)) {
        const shouldRetry = attempt < MAX_ATTEMPTS;
        logAttempt({
          mode, attempt, status: 200, ms: Date.now() - startedAt,
          note: payload ? 'JSON unvollständig' : 'kein gültiges JSON',
          usage, retry: shouldRetry
        });
        lastFailure = { status: 502, code: 'bad_response' };
        if (shouldRetry) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        return { ok: false, ...lastFailure };
      }

      logAttempt({ mode, attempt, status: 200, ms: Date.now() - startedAt, note: 'ok', usage });
      return { ok: true, payload };
    } catch (err) {
      // Hierher kommen abgebrochene Verbindungen, DNS-Aussetzer und Timeouts.
      // In der alten Fassung sprang ein solcher Fehler an allen Wiederholungs-
      // versuchen vorbei und wurde sofort zur Fehlermeldung beim Besucher.
      const timedOut = err.name === 'AbortError';
      const shouldRetry = attempt < MAX_ATTEMPTS;
      logAttempt({
        mode, attempt, status: 0, ms: Date.now() - startedAt,
        note: timedOut ? 'Zeitüberschreitung' : `Netzwerkfehler: ${err.message}`,
        retry: shouldRetry
      });
      lastFailure = timedOut
        ? { status: 504, code: 'timeout' }
        : { status: 502, code: 'network_error' };
      if (shouldRetry) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      return { ok: false, ...lastFailure };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, ...lastFailure };
}

function codeForStatus(status) {
  if (status === 429) return 'rate_limited';
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 400) return 'bad_request';
  if (status === 529 || status === 503) return 'overloaded';
  return 'upstream_error';
}

// ---------------------------------------------------------------------------
// Protokollierung
// ---------------------------------------------------------------------------
// Eine Zeile pro Versuch. Damit lässt sich in den Clever-Cloud-Logs direkt ablesen,
// WARUM eine Anfrage gescheitert ist, statt es aus der Fehlermeldung im Browser
// erraten zu müssen. Es wird bewusst kein Nutzertext protokolliert.
function logAttempt({ mode, attempt, status, ms, note, usage, retry }) {
  const parts = [
    `[gfk] mode=${mode}`,
    `versuch=${attempt}/${MAX_ATTEMPTS}`,
    `status=${status}`,
    `dauer=${ms}ms`
  ];
  if (usage) {
    parts.push(`tokens_ein=${usage.input_tokens ?? '?'}`);
    parts.push(`tokens_aus=${usage.output_tokens ?? '?'}`);
  }
  parts.push(`ergebnis=${note}`);
  if (retry) parts.push('→ wiederholt');
  console.log(parts.join(' '));
}

// ---------------------------------------------------------------------------
// Missbrauchsschutz
// ---------------------------------------------------------------------------
// Max. 20 Anfragen pro Minute pro Besucher-IP. Auf Netlify hat das die Plattform
// selbst übernommen — auf Clever Cloud gibt es das nicht eingebaut, deshalb hier
// als einfacher, eigenständiger Zähler im Arbeitsspeicher nachgebaut.
// Der Wert lag früher bei 10. Weil der Browser bei einem Fehlschlag automatisch
// einen zweiten Versuch startete, waren davon real nur etwa fünf Klicks übrig.
// Das traf vor allem Besucher, die sich eine IP teilen (Mobilfunk, Einrichtungen).
const WINDOW_SIZE_MS = 60 * 1000;
const WINDOW_LIMIT = 20;
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > WINDOW_SIZE_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  record.count++;
  return record.count > WINDOW_LIMIT;
}

// Alte Einträge regelmäßig aufräumen, damit die Map nicht unbegrenzt wächst.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > WINDOW_SIZE_MS) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// API-Route
// ---------------------------------------------------------------------------
app.post('/api/gfk-proxy', async (req, res) => {
  if (isRateLimited(req.ip)) {
    res.set('Retry-After', '60');
    return res.status(429).json({
      code: 'rate_limited',
      error: 'Zu viele Anfragen, bitte kurz warten.'
    });
  }

  const { mode, text } = req.body || {};
  const config = MODE_CONFIG[mode];

  if (!config || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ code: 'bad_request', error: 'mode und text werden benötigt' });
  }

  if (text.length > config.maxInputChars) {
    return res.status(413).json({ code: 'too_long', error: 'Der Text ist zu lang.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[gfk] ANTHROPIC_API_KEY ist nicht gesetzt');
    return res.status(500).json({ code: 'auth_error', error: 'Serverkonfiguration unvollständig' });
  }

  const result = await callAnthropic(mode, text.trim());

  if (!result.ok) {
    return res.status(result.status).json({ code: result.code, error: 'Anfrage nicht erfolgreich' });
  }

  // Neu: Der Server liefert das bereits geprüfte Ergebnis-Objekt direkt aus.
  // Früher bekam der Browser die Rohantwort der API und musste selbst JSON
  // herausschneiden — schlug das fehl, war die Anfrage für den Besucher verloren.
  // Jetzt scheitert so etwas serverseitig und wird still wiederholt.
  res.status(200).json(result.payload);
});

app.listen(PORT, () => {
  console.log(`GFK-Kompass Server läuft auf Port ${PORT} (Modell ${MODEL}, effort ${EFFORT})`);
});
