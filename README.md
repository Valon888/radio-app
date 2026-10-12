# Mini IPTV + Radio

Luajtës IPTV dhe radio në shfletues, i ndërtuar me **HTML, CSS dhe JavaScript të pastër** (pa framework,
pa backend të detyrueshëm). Fokusi: **stabilitet i luajtjes**, rilidhje automatike, burime rezervë dhe
health-check i kanaleve.

> Përdor vetëm stream-e që janë ligjërisht të lejuara (kanale publike/falas ose me licencë).
> Projekti nuk përfshin dhe nuk promovon burime piratërie.

## Çfarë ofron

- **Luajtje e fortë**: hls.js (me fallback native për Safari), mpegts.js për `.ts`/`.flv`, `<audio>` për radio.
- **Rilidhje automatike** me backoff eksponencial (1s, 2s, 4s, 8s…) kur stream-i ngec, dështon ose nuk ka progres.
- **Disa burime për kanal**: nëse i pari dështon, kalon automatikisht te i dyti, i treti…
- **Health-check**: pikë ngjyre te çdo kanal (Online / Ngadalë / Offline / I bllokuar / E panjohur), buton "Testo kanalet",
  filtër "Fshih offline", dhe mjet terminali që krijon raport.
- **ABR automatik** dhe zgjedhje manuale e cilësisë (Auto/1080p/720p/…), e ruajtur në shfletues.
- **UX**: temë e errët, responsive (telefon → TV), logo, grupe, kërkim, të preferuarat ★, historik,
  navigim me tastierë/telekomandë, ekran i plotë, Picture-in-Picture, AirPlay/Cast ku mbështetet.
- **PWA**: instalohet si aplikacion; cache vetëm për asset-et statike (kurrë për stream-et).
- **Proxy opsional** për CORS dhe mixed content (lokal ose Cloudflare Worker / Netlify Function).

## Nisja e shpejtë

```bash
node server.js 3002          # ose: npm start
# hap http://localhost:3002
```

Në Windows mjafton `start-server.bat`.

`server.js` shërben aplikacionin dhe ofron `/proxy?url=…`. Si parazgjedhje dëgjon **vetëm te localhost**.
Për ta hapur nga telefoni ose TV në rrjetin lokal: `HOST=0.0.0.0 node server.js` (Windows PowerShell:
`$env:HOST='0.0.0.0'; node server.js`). Mund edhe ta hostosh si faqe statike (GitHub Pages), por atje
streamet pa CORS ose me `http://` kërkojnë proxy të jashtëm (shih më poshtë).

## Struktura

```
index.html            guaskë e aplikacionit
css/app.css           stilet
js/
  main.js             pika e hyrjes, lidh modulet
  config.js           parametrat (proxy, timeout-e, TTL)
  storage.js          localStorage i sigurt, të preferuarat, historiku
  network.js          zbulimi i proxy-t dhe rendi i rrugëve (direkt/proxy)
  channels.js         ngarkimi dhe filtrimi i kanaleve
  health.js           health-check në shfletues me paralelizëm të kufizuar
  player.js           hls.js / mpegts.js / audio, rilidhje, fallback burimesh
  epg.js              EPG bazik nga data/epg.json
  ui.js               lista, kontrollet, shkurtoret
data/
  channels.json       lista e kanaleve (e gjeneruar, shih më poshtë)
  health.json         rezultati i fundit i tools/check-channels.js
  custom.m3u          (opsionale) kanalet e tua
tools/
  build-channels.js   ndërton data/channels.json nga listat JS dhe M3U
  check-channels.js   teston URL-të dhe krijon channels-report.md
  xmltv-to-json.js    XMLTV → data/epg.json
proxy/                shembuj për Cloudflare Worker dhe Netlify Function
sw.js, manifest.webmanifest, icons/   PWA
```

Skedarët e vjetër në rrënjë (`items.js`, `fallback-channels.js`, `*.m3u`, `fixed_index.html`, …) janë burime
të të dhënave ose mjete të vjetra; aplikacioni i ri nuk i ngarkon drejtpërdrejt, por `tools/build-channels.js`
i përdor si hyrje.

## Si shtohen kanale

1. Shto hyrje në `data/custom.m3u` (format M3U standard):
   ```
   #EXTM3U
   #EXTINF:-1 tvg-id="EmriIm.al" tvg-logo="https://…/logo.png" group-title="Shqipëri",Emri i Kanalit
   https://shembull.com/live/stream.m3u8
   ```
2. Rindërto listën: `node tools/build-channels.js`
3. (Opsionale) testo: `node tools/check-channels.js --group=Shqipëri`

**Disa burime për të njëjtin kanal**: shkruaj dy hyrje me të njëjtin emër (ose të njëjtin `tvg-id`); ndërtuesi
i bashkon në një kanal me `sources[]`. Burimet HTTPS rendisen para HTTP, dhe ato që punojnë sipas testit
rendisen para atyre offline.

Radio: përdor URL `.mp3`/`.aac`/Icecast; ndërtuesi e njeh si audio.

## Health-check

**Në shfletues** (butoni "Testo kanalet" ose automatikisht për Kosovë/Shqipëri): kontrollohen manifestet me
maksimumi 5 kërkesa paralelisht dhe timeout 8s. Rezultati ruhet në `localStorage` me TTL 6 orë.
Pa proxy, shfletuesi nuk mund të lexojë manifestet pa CORS; ato shfaqen si **E panjohur** (gri), jo si offline.

**Në terminal** (rezultat më i plotë, kontrollon edhe segmentin e parë):

```bash
node tools/check-channels.js                         # të gjitha
node tools/check-channels.js --type=tv --group=Kosov # me filtër
node tools/check-channels.js --concurrency=30 --timeout=10000
```

Krijon `data/health.json` (përdoret nga aplikacioni) dhe `channels-report.md` me kanalet offline, të bllokuara
(401/403, gjeo) dhe pjesërisht funksionale. Rezultati varet nga rrjeti nga ekzekutohet testi.

> Nëse një kanal është i vdekur në burim, asnjë ndryshim klienti nuk e rregullon. Raporti i tregon cilat janë.

## Problemet e rrjetit: CORS dhe mixed content

| Situata | Zgjidhja |
|---|---|
| Faqja hapet nga `node server.js` | Proxy-ja `/proxy` zbulohet vetë dhe përdoret kur duhet |
| Faqja në HTTPS (GitHub Pages), stream HTTP | Nevojitet proxy i jashtëm (më poshtë) |
| Stream pa CORS në faqe statike | Nevojitet proxy i jashtëm |

### Cloudflare Worker (rekomandohet)

1. Cloudflare → Workers & Pages → Create → Worker, ngjit `proxy/cloudflare-worker.js`.
2. Variabla `ALLOWED_ORIGINS` = origjina e faqes sate, p.sh. `https://valon888.github.io` (ndaje me presje për disa).
   **Mos e lër bosh**: pa të, Worker-i refuzon çdo kërkesë nga shfletuesit.
3. Te `index.html`, para `js/main.js`:
   ```html
   <script>window.MINI_IPTV_CONFIG = { PROXY_URL: 'https://emri.workers.dev' };</script>
   ```

### Netlify Function

Ruaje `proxy/netlify-function.js` si `netlify/functions/proxy.js`, vendos `ALLOWED_ORIGINS` dhe
`PROXY_URL = https://sajti-yt.netlify.app/.netlify/functions/proxy`. Netlify ka kufij madhësie përgjigjeje;
për video Cloudflare është zgjedhje më e mirë.

**Siguri**: mos përdor proxy publikë të panjohur (mund të ndryshojnë ose regjistrojnë trafikun). Proxy-t e këtij
projekti bllokojnë adresa private/localhost dhe lejojnë vetëm origjinat e konfiguruara; `server.js` dëgjon
vetëm te localhost si parazgjedhje dhe refuzon kërkesat cross-site.

## Shkurtoret

| Tasti | Veprimi |
|---|---|
| ↑ / ↓ , PgUp / PgDn, Home / End | lëviz në listë |
| Enter | luaj kanalin e zgjedhur |
| ← / → | kanali i mëparshëm / tjetër |
| 0–9 | kalim i shpejtë te numri i kanalit (numri në listë) |
| Hapësirë | luaj / pauzë |
| F, P, M | ekran i plotë, Picture-in-Picture, pa zë |
| S | shto/hiq nga të preferuarat |
| N | burimi tjetër i kanalit, R provo përsëri |
| + / − | volumi |
| / | kërko |

## EPG

Mbështetet **EPG bazik** nga `data/epg.json`:

```json
{ "RTK1.xk": [ { "start": "2025-01-01T20:00:00Z", "end": "2025-01-01T21:00:00Z", "title": "Lajmet" } ] }
```

Çelësi është id e kanalit (me ose pa `@SD`) ose emri. Për XMLTV:
`node tools/xmltv-to-json.js guide.xml > data/epg.json`.
Nëse skedari mungon, EPG nuk shfaqet. **TODO**: marrje automatike e XMLTV nga një burim publik dhe harta e
ID-ve tvg-id → kanal.

## Cast / AirPlay

- **AirPlay** (Safari): butoni shfaqet kur shfletuesi e mbështet.
- **Chromecast**: Remote Playback API funksionon vetëm kur burimi luhet nativisht; streamet e luajtura nga hls.js
  (MSE) zakonisht nuk mund të "castohen" nga faqja. Përdor "Cast tab" nga menyja e Chrome.

## Lista e kontrollit (testim manual)

Para çdo publikimi, kontrollo në secilin shfletues/pajisje:

- [ ] Chrome desktop: hap `http://localhost:3002`, luaj një kanal HLS, ndërro kanalin 5 herë pa gabime në konsolë
- [ ] Firefox desktop: HLS + radio
- [ ] Safari macOS: HLS nativ (pa hls.js), AirPlay
- [ ] Android Chrome: layout responsive, fullscreen, instalim PWA
- [ ] iOS Safari: luajtje inline, PiP, fullscreen (`playsinline`)
- [ ] Rilidhje: nis një kanal, ndërpre rrjetin 15s dhe rilidhe; duhet të rifillojë vetë
- [ ] Fallback: kanal me burim të parë të vdekur kalon te i dyti (mesazh "burimi 2/N")
- [ ] Gabim: kanal i vdekur shfaq "Nuk ka sinjal" me butonat Provo përsëri / Burimi tjetër / Kanal tjetër
- [ ] Tastierë: ↑↓ Enter, numra, F, M, S, N, R
- [ ] Ruajtje: rifresko faqen dhe kontrollo kanalin e fundit, volumin, cilësinë, të preferuarat
- [ ] Health: "Testo kanalet" përditëson pikat; "Fshih offline" filtron
- [ ] HTTPS pa proxy: kanalet `http://` shfaqin mesazh të qartë, jo ngrirje
- [ ] PWA: offline shfaq guaskën; stream-et nuk ruhen në cache

## Kufizime të njohura

- Cilësia përfundimtare varet nga serveri burimor; klienti mund vetëm të rilidhet, të provojë burime rezervë
  dhe të bufferojë më mirë.
- Disa burime bllokohen gjeografikisht (403/401) ose kërkojnë token që skadon.
- Pa proxy, stream-et pa CORS nuk luhen nga faqe statike.
- Chromecast për stream MSE (shih më lart).

## Licenca

Shih `LICENSE` nëse ekziston; përndryshe të gjitha të drejtat i përkasin autorit të repo-s.
