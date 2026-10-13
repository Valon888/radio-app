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
  channels.js         ngarkimi lazy sipas shtetit dhe filtrimi i kanaleve
  health.js           health-check në shfletues me paralelizëm të kufizuar
  player.js           hls.js / mpegts.js / audio, rilidhje, fallback burimesh
  epg.js              EPG bazik nga data/epg.json
  ui.js               lista, kontrollet, shkurtoret
data/
  index.json          shtetet (emri, numri i kanaleve) dhe cilët ngarkohen në nisje
  countries/<kodi>.json  kanalet e një shteti (xk, al, mk, ..., radio, other); ngarkohen sipas nevojës
  health/<kodi>.json  rezultati i fundit i tools/check-channels.js, një skedar për shtet
  sources/iptv-org/   kopja e filtruar e https://github.com/iptv-org/iptv/tree/master/streams
  custom.m3u          (opsionale) kanalet e tua
tools/
  import-iptv-org.js  importon dhe filtron streams/*.m3u të iptv-org
  build-channels.js   ndërton data/index.json dhe data/countries/*.json
  check-channels.js   teston URL-të dhe krijon data/health/*.json + channels-report.md
  lib/iptv-filters.js parser M3U + filtrat (token, adult, protokolle)
tests/                teste njësie (node --test) dhe e2e me Playwright
.github/workflows/health.yml  health-check javor automatik
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
2. Rindërto listën: `node tools/build-channels.js` (shkruan `data/index.json` dhe `data/countries/*.json`)
3. (Opsionale) testo: `node tools/check-channels.js --group=Shqipëri`

**Disa burime për të njëjtin kanal**: shkruaj dy hyrje me të njëjtin emër (ose të njëjtin `tvg-id`); ndërtuesi
i bashkon në një kanal me `sources[]`. Burimet HTTPS rendisen para HTTP, dhe ato që punojnë sipas testit
rendisen para atyre offline.

Radio: përdor URL `.mp3`/`.aac`/Icecast; ndërtuesi e njeh si audio.

## Kanalet nga iptv-org

Burimi: <https://github.com/iptv-org/iptv/tree/master/streams> (commit `ffee614`, importuar më **2026-10-13**).
Metadatat (kategoria, shteti, logoja) vijnë nga <https://iptv-org.github.io/api/>.

```bash
git clone --depth 1 https://github.com/iptv-org/iptv D:/iptv-org-tmp          # jashtë repo-s
# (opsionale, për kategori dhe logo)
mkdir D:/iptv-org-tmp/api && curl -L -o D:/iptv-org-tmp/api/channels.json https://iptv-org.github.io/api/channels.json
curl -L -o D:/iptv-org-tmp/api/logos.json https://iptv-org.github.io/api/logos.json
node tools/import-iptv-org.js D:/iptv-org-tmp   # filtron -> data/sources/iptv-org/
node tools/build-channels.js                    # bashkon + ndan sipas shtetit
```

Importi hedh: përmbajtje për të rritur, YouTube/Twitch/Facebook, URL me `token`/`key`/`signature`/`auth`/`password`,
URL me kredenciale (`user:pass@`), segmente rruge që duken si çelës i fshehtë (p.sh. `/play/<64 shenja>`), protokolle jo-HTTP(S) (rtmp, rtsp, srt, mmsh), host-e private dhe kanale të mbyllura.
Nga 17968 hyrje u mbajtën 17499 (të refuzuara: secret-param 247, closed 88, adult 7, secret-path 108, video-site 6, protocol 13).
Pas bashkimit me kanalet manuale dhe heqjes së dublikatave: **12542 kanale TV** dhe **141 radio** në 183 shtete/grupe.

**Ngarkimi i shpejtë:** në nisje ngarkohen vetëm Kosovë, Shqipëri, Maqedoni e Veriut, Mal i Zi, Serbi, Greqi dhe radiot
(~90 KB); shtetet e tjera ngarkohen kur i zgjedh nga menyja "Shteti" (ose me "Kërko në të gjitha shtetet").
Kanalet e preferuara/historiku/i fundit ngarkojnë shtetin e tyre automatikisht.

**Referrer:** disa burime kërkojnë `Referer` të caktuar (`#EXTVLCOPT:http-referrer`). Shfletuesi nuk mund ta vendosë,
ndaj proxy-t (`server.js`, Worker, Netlify) e pranojnë parametrin `ref=` dhe e dërgojnë te burimi.

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

Krijon `data/health/<kodi>.json` (përdoret nga aplikacioni) dhe `channels-report.md` me përmbledhje sipas shtetit dhe
kanalet offline, të bllokuara (401/403, gjeo) dhe pjesërisht funksionale për Kosovën, Shqipërinë dhe fqinjët.
Testi ndjek manifestin, pastaj nivelin dhe kërkon segmentin e parë (jo vetëm HEAD); radio/.ts/.flv testohen me
kërkesë për bajtët e parë. `--country=xk,al` teston vetëm ato shtete.

**Automatik:** `.github/workflows/health.yml` e ekzekuton çdo të hënë (ose me dorë nga Actions) dhe bën commit të
`data/health/` dhe `channels-report.md`. Rezultati varet nga rrjeti i runner-it GitHub; disa kanale gjeo-bllokohen
vetëm aty, kështu që aplikacioni i mban rezultatet statike vetëm si sugjerim: rezultatet e shfletuesit (me TTL 6 orë) i mbivendosin.

> Nëse një kanal është i vdekur në burim, asnjë ndryshim klienti nuk e rregullon. Raporti i tregon cilat janë.

## Problemet e rrjetit: CORS dhe mixed content

| Situata | Zgjidhja |
|---|---|
| Faqja hapet nga `node server.js` | Proxy-ja `/proxy` zbulohet vetë dhe përdoret kur duhet |
| Faqja në HTTPS (GitHub Pages), stream HTTP | Nevojitet proxy i jashtëm (më poshtë) |
| Stream pa CORS në faqe statike | Nevojitet proxy i jashtëm |

### Cloudflare Worker (rekomandohet)

1. Nga terminali: `cd proxy && npx wrangler login && npx wrangler deploy` (përdor `proxy/wrangler.toml`, ku `ALLOWED_ORIGINS` është tashmë i vendosur),
   ose Cloudflare → Workers & Pages → Create → Worker, ngjit `proxy/cloudflare-worker.js`.
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

## Teste

```bash
npm test            # njësi: filtrat/parseri M3U + kontrollet e të dhënave (pa rrjet)
npm i -D playwright # një herë
npm run test:e2e    # hap aplikacionin në Edge/Chrome dhe verifikon që video.currentTime ecën për ~18 kanale
```

Testi e2e zgjedh kanale që `data/health/*.json` i ka shënuar online, ngarkon shtetet lazy dhe shkruan `e2e-report.md`
(arsyet e dështimit: timeout, 403, CORS, mixed content). Përdor Edge/Chrome të instaluar sepse Chromium i Playwright
nuk ka kodekë H.264/AAC.

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
Nëse skedari mungon, EPG nuk shfaqet.

### Gjenerimi i EPG me iptv-org/epg (pa Docker)

```bash
git clone --depth 1 -b master https://github.com/iptv-org/epg.git D:/epg
cd D:/epg && npm install

# 1. (një herë, ose pas ndryshimit të listës) channels.xml nga kanalet e projektit
cd D:/mini-iptv
node tools/build-epg-channels.js D:/epg > epg/channels.xml

# 2. merr programin (burimet: ipko.tv, tvim.tv)
cd D:/epg
npx tsx scripts/commands/epg/grab.ts -c D:/mini-iptv/epg/channels.xml -o D:/epg/guide.xml --days 2 --maxConnections 5

# 3. shndërro në JSON për aplikacionin
cd D:/mini-iptv
node tools/xmltv-to-json.js D:/epg/guide.xml > data/epg.json
```

`build-epg-channels.js` përputh emrat e kanaleve me listat e `ipko.tv` dhe `tvim.tv` (vetëm nga i njëjti shtet).
Aktualisht mbulohen ~30 kanale (RTSH, RTK 2/3, RTV21, T7, TV Arta, Syri dhe kanalet turke). Programi ruan
vetëm 36 orët e ardhshme, ndaj përsërite hapin 2–3 çdo ditë (p.sh. me Task Scheduler). Për më shumë kanale,
shto emrat te listat ose një `custom.m3u` me të njëjtat emra si në `ipko.tv.channels.xml`.

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

## Radio rajonale (radio-browser.info)

`node tools/import-radio.js` merr stacionet publike të radiove nga [radio-browser.info](https://www.radio-browser.info/)
për Kosovë, Shqipëri, Maqedoni e Veriut, Mal të Zi, Kroaci, Slloveni dhe Serbi, i teston me lidhje të vërtetë
(audio ose playlist HLS) dhe ruan vetëm ato që punojnë te `data/sources/radio/`. Pastaj `npm run build:channels`.
Aplikacioni përdor Media Session (kontrolle në ekranin e kyçur dhe tastet e kufjeve).

## Kanale nga tvmak.com

`node tools/import-tvmak.js` lexon faqet publike të kanaleve te [tvmak.com](https://tvmak.com), heq query-n
(cache-buster), testo me lidhje të vërtetë dhe pranon vetëm transmetime **live** (playlist pa `#EXT-X-ENDLIST`).
Rezultati ruhet te `data/sources/tvmak/`; shteti caktohet te `data/country-overrides.json`.
