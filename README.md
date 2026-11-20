# Waldläufer 🌲

Ein Open-World-Survival-Spiel im Wald, das direkt im Browser läuft (3D, Ego-Perspektive, Three.js).
Die Welt wird prozedural erzeugt und ist endlos – Wälder, Lichtungen, Seen und schneebedeckte Berge.

## Starten

ES-Module funktionieren nicht über `file://`, daher einen kleinen lokalen Webserver starten:

```bash
python3 -m http.server 8000
# dann im Browser öffnen: http://localhost:8000
```

Alternativ das Repository über **GitHub Pages** veröffentlichen (Settings → Pages → Branch wählen) –
es wird kein Build-Schritt benötigt. Three.js liegt bereits unter `lib/`, das Spiel läuft also auch offline.

Empfohlen: Desktop-Browser (Chrome, Firefox, Edge) mit Maus und Tastatur.

## Steuerung

| Taste | Aktion |
|---|---|
| W A S D | Bewegen |
| Maus | Umsehen |
| Shift | Sprinten (kostet Ausdauer) |
| Leertaste | Springen |
| Linksklick | Schlagen, Bäume fällen, Felsen abbauen, essen, bauen |
| E | Aufheben, Beeren pflücken, trinken, Fleisch braten, schlafen |
| R | Holz ins Feuer legen, Feldflasche füllen |
| 1–0 / Mausrad | Hotbar |
| Tab | Rucksack & Herstellen |
| F | Schnell essen |
| Esc | Pause |

## Überleben

- **Gesundheit, Hunger, Durst, Wärme, Ausdauer** – wenn Hunger, Durst oder Wärme auf null fallen, verlierst du Gesundheit.
- **Tag/Nacht**: Ein Tag dauert 10 Minuten. Nachts wird es kalt und dunkel, und Wölfe werden aktiv.
- **Feuer** wärmt, spendet Licht, brät Fleisch und hält Wölfe auf Abstand. Es braucht regelmäßig Holz.
- **Wasser**: An Seen trinken (E) oder die Feldflasche füllen (R).
- **Tiere**: Rehe und Hasen fliehen, Wölfe greifen an. Erlegte Tiere liefern Fleisch und Fell.
- **Unterschlupf**: Nachts schlafen und dort nach dem Tod wieder aufwachen.
- Gefällte Bäume, abgebaute Felsen und gepflückte Sträucher wachsen nach einigen Tagen nach.
- Das Spiel speichert automatisch im Browser (localStorage).

## Grafik

Alle Oberflächen haben Pixeltexturen im 16×16-Stil: Gras, Erde, Sand, Stein, Schnee, Rinde,
Birkenrinde, Blätter, Nadeln, Holzbretter, Fell und Wasser. Die Texturen werden beim Start
erzeugt, es gibt keine Bilddateien.

## Herstellen

Manche Rezepte brauchen **Seil** (3 Fasern), die Pilzsuppe kann nur direkt an einem
brennenden Lagerfeuer gekocht werden.

| Gegenstand | Kosten | Nutzen |
|---|---|---|
| 🪢 Seil | 3 Fasern | Material für viele Rezepte |
| ➶ 5 Pfeile | 2 Holz, 1 Stein, 1 Fasern | Munition für den Bogen |
| 🪓 Steinaxt | 3 Holz, 2 Stein, 2 Fasern | Bäume fällen, Bauten abreißen |
| ⛏️ Spitzhacke | 3 Holz, 3 Stein, 2 Fasern | Felsen abbauen |
| 🏏 Holzkeule | 5 Holz | Kräftige Schlagwaffe |
| 🔱 Speer | 4 Holz, 1 Stein, 3 Fasern | Starke Waffe mit Reichweite |
| 🏹 Bogen | 3 Holz, 2 Seil | Fernkampf mit Pfeilen |
| 🎣 Angel | 3 Holz, 1 Seil | Fische fangen |
| 🔥 Fackel | 1 Holz, 2 Fasern | Licht und etwas Wärme |
| 🧴 Feldflasche | 1 Fell, 2 Fasern | 3 Portionen Wasser tragen |
| 🧥 Fellmantel | 4 Fell, 4 Fasern | Halbiert die Auskühlung |
| 🦺 Fellrüstung | 5 Fell, 2 Seil | 40 % weniger Schaden durch Wölfe |
| 🏕️ Lagerfeuer | 5 Holz, 4 Stein | Wärme, Licht, Braten, Schutz |
| ⛺ Unterschlupf | 10 Holz, 6 Fasern, 2 Fell | Schlafen, Wiedereinstiegspunkt |
| 🚧 Palisade | 4 Holz, 1 Seil | Zaun, durch den keine Tiere kommen |
| 🪤 Hasenfalle | 3 Holz, 2 Seil | Fängt mit der Zeit Hasen (Fleisch + Fell) |
| 🩹 Verband | 4 Fasern | Heilt 30 Gesundheit |
| 🧃 Beerensaft | 5 Beeren, 1 Wasser | Löscht viel Durst |
| 🍲 Pilzsuppe | 3 Pilze, 1 Wasser, am Feuer | Sättigt, löscht Durst, wärmt |

**Angeln:** Angel auswählen, mit Linksklick ins Wasser werfen und warten, bis der Schwimmer
abtaucht. Dann sofort noch einmal klicken. Rohen Fisch am Lagerfeuer braten (E).

**Abreißen:** Mit ausgerüsteter Steinaxt dreimal auf einen Bau schlagen. Ein Teil des Holzes
kommt zurück.

**Tipp für den Start:** Äste (Holz), kleine Steine und Farne (Fasern) liegen überall am Boden.
Damit baust du zuerst die Axt – und vor Einbruch der Nacht ein Lagerfeuer.

## Projektstruktur

```
index.html        Oberfläche (HUD, Menüs, Inventar)
style.css         Gestaltung
src/main.js       Spielablauf, Interaktion, Speichern
src/world.js      Prozedurales Terrain, Wald, Objekte, Chunks
src/env.js        Tag/Nacht, Himmel, Licht
src/player.js     Bewegung, Physik, Schwimmen
src/animals.js    Tiere und ihr Verhalten
src/models.js     Bauten, Pfeile und Gegenstände in der Hand
src/textures.js   16×16-Pixeltexturen
src/items.js      Gegenstände und Rezepte
src/audio.js      Synthetische Klänge (WebAudio)
src/ui.js         HUD, Minikarte, Inventar
lib/              Three.js (MIT-Lizenz)
```
