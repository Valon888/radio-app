# Mini IPTV + Radio

Aplikacion web (HTML, CSS, JavaScript, pa backend) për TV live (HLS/MPEG-TS) dhe radio online, për desktop dhe telefon.

## Çfarë ka brenda

- TV dhe radio në të njëjtin aplikacion, me kërkim dhe filtra sipas llojit dhe grupit
- Lista e kanaleve ngarkohet nga skedarët në repo (`fallback-channels.js`, `radio-channels.js`, M3U si `al.m3u`, `xk.m3u`)
- Luajtës i qëndrueshëm (`player.js`):
  - hls.js për `.m3u8`, mpegts.js (ngarkohet vetëm kur duhet) për `.ts`/`.flv`
  - rilidhje automatike me pritje në rritje (1s, 2s, 4s, deri 8s), me limit të qartë
  - fallback automatik te burimet e tjera të të njëjtit kanal
  - watchdog: nëse videoja ngec pa progres për 9 sekonda, rilidhet vetë
  - cilësi Auto (ABR) ose tavan 480p/720p/1080p, që aplikohet menjëherë pa e rinisur kanalin
  - kur kthehet interneti (`online`), provon përsëri vetë
  - mesazh i qartë gabimi me butonat **Provo përsëri** dhe **Kanal tjetër**
- Ruan kanalin e fundit dhe cilësinë e zgjedhur
- Treguesi i sinjalit llogaritet nga të dhëna reale (buffer, brez-bandë, frame të humbura), nuk është i simuluar

## Si e hapni

1. Nga GitHub Pages (HTTPS), ose lokalisht: `node server.js` ose çdo server statik.
2. Zgjidhni një kanal nga lista. Tastet `↑` `↓` ndërrojnë kanalin, `Space` bën pauzë.
3. Kanale të reja shtohen te `fallback-channels.js` (shih më poshtë) ose me një skedar M3U.

## Si shtohen kanale dhe burime rezervë

Në `items`/`fallback-channels.js` çdo kanal mund të ketë burime shtesë:

```js
{
  id: "shembull",
  name: "Kanali Shembull",
  url: "https://burimi-kryesor.example/live.m3u8",
  fallbackUrls: ["https://burimi-rezerve.example/live.m3u8"],
  type: "tv",            // "tv" | "radio" | "iframe" | "external"
  group: "Shqipëri",
  logo: ""
}
```

Kanalet me të njëjtin emër dhe lloj trajtohen automatikisht si burime rezervë të njëri-tjetrit.

## Çfarë mund dhe çfarë nuk mund të bëjë kodi

Kodi në shfletues nuk e bën dot "më të fortë" një stream që serveri burimor e jep keq ose e ka ndalur. Përmirësimet këtu (rilidhje, fallback, buffer, ABR, watchdog) janë maksimumi real nga ana e klientit. Nëse një kanal është vdekur në burim, duhet të zëvendësohet me një burim tjetër.

## Mixed content dhe CORS (kanale që nuk hapen në GitHub Pages)

Faqja në HTTPS nuk lejon burime `http://`. Aplikacioni provon vetë versionin `https://`, dhe nëse ka proxy e provon edhe atë. Kanalet që bllokohen nga CORS zgjidhen vetëm me proxy.

Proxy i vogël, i sigurt (vetëm hostet që ju i listoni) ndodhet te `tools/proxy-worker.mjs`:

1. Krijoni një Cloudflare Worker dhe ngjitni kodin e atij skedari.
2. Vendosni variablat `ALLOWED_HOSTS` (hostet e kanaleve, edhe të segmenteve) dhe `ALLOWED_ORIGINS` (faqja juaj, p.sh. `https://valon888.github.io`).
3. Në `index.html` shtoni para skripteve: `<script>window.IPTV_PROXY_URL = 'https://emri-juaj.workers.dev/?url=';</script>`

Mos përdorni proxy publikë të panjohur: ata mund të lexojnë ose ndryshojnë trafikun.

Shënim: `items.js` ka një mekanizëm më të vjetër (`PROXY_HOST`, bosh si parazgjedhje). Përdorni vetëm njërin nga të dyja, jo të dyja njëkohësisht.

## Kontrolli i kanaleve nga terminali

```bash
node tools/check-channels.js                 # skanon *.m3u dhe fallback-channels.js
node tools/check-channels.js al.m3u xk.m3u   # vetëm këto skedarë
```

Krijon `channels-report.md` dhe `channels-report.json` me kanalet Online, Ngadalë dhe Offline. URL-të në raport shfaqen pa query string, që tokenat të mos dalin në git. Nëse kompjuteri nuk arrin dot internetin, skripti e thotë dhe nuk krijon raport të gabuar. Rezultati vlen për rrjetin nga ku e nisni; një kanal mund të punojë këtu dhe të bllokohet në shfletues nga CORS.

## Teste

```bash
npm test
```

Testojnë logjikën e `player.js` (fallback, rilidhje, limitet, tavani i cilësisë) dhe proxy-n me mock-e, pa shfletues.

## Lista e kontrollit manual

Provoni te secili shfletues/pajisje: Chrome desktop, Firefox, Safari macOS, Android Chrome, iOS Safari.

- [ ] Një kanal HLS hapet dhe luan brenda disa sekondave
- [ ] Një radio MP3/AAC luan, dhe ndërrimi TV ↔ radio nuk lë zë nga e vjetra
- [ ] Ndërrimi i shpejtë i kanaleve disa herë radhazi nuk e ngec aplikacionin
- [ ] Shkëputni internetin 15 sekonda dhe e ktheni: luajtja rinis vetë
- [ ] Një kanal i vdekur tregon mesazhin me **Provo përsëri** dhe **Kanal tjetër**
- [ ] Zgjedhja 480p/720p aplikohet menjëherë, **Auto** kthen ABR-në
- [ ] Rifreskimi i faqes kthen kanalin e fundit
- [ ] iOS Safari: luajtja native e HLS punon (hls.js nuk mbështetet aty)

## Çështje të njohura

- Disa URL në repo përmbajnë tokena ose kredenciale (p.sh. `token=...`, ose `/live/<përdorues>/<fjalëkalim>/...`). Ato nuk duhet të jenë në repo publik, dhe kanalet me pagesë nuk duhet të shpërndahen pa leje. Rekomandohet t'i hiqni ose t'i zëvendësoni me burime të lejuara.
- Bashkimi i të gjitha listave M3U në një listë të vetme dhe EPG nuk janë bërë ende.

## Ligjshmëria

Përdorni vetëm stream-e publike/falas ose me licencë.

## Kontribut

Pull request-et dhe sugjerimet janë të mirëpritura.
