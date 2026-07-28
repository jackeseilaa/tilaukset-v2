# J Sailing — Tilaukset v2 (uusi hallintapaneeli, rakenteilla)

Uusi, kevyempi tilaus- ja laskutushallinta Absolut 37 -purjehdusristeilyille (J Sailing Tmi / AJarmo Oy), rakennettu alusta alkaen erilliseksi projektiksi vanhan [`tilaukset`](https://github.com/jackeseilaa/tilaukset)-sovelluksen rinnalle. Vanha sovellus pysyy koskemattomana ja käytössä koko rakennusvaiheen ajan.

**Miksi tämä on olemassa:** vanha sovellus on yksi 345 kt:n tiedosto, 400+ committia, kertynyttä monimutkaisuutta. Tämä on sama toiminnallisuus uudelleenkirjoitettuna moduuleiksi jaettuna, samalla Firebase/Firestore-reaaliaikaisuudella, mutta ilman build-työkalua (ei npm/Vite/React selaimessa — pelkkä `<script type="module">`, sama nolla-build GitHub Pages -julkaisu kuin vanhassa).

## Tila: runkovaihe (2026-07-28)

Tehty:
- Kirjautuminen (Google, rajattu `jacke.seilaa@gmail.com`), reaaliaikainen Firestore-kytkentä 8 kokoelmalle + `meta`.
- Tilasäiliö (`js/store.js`) + toimintorekisteri/tapahtumadelegointi (`js/dispatch.js`) — korvaa vanhan 950-rivisen `bind()`-funktion ja 115-haaraisen if-ketjun.
- Tyhjät välilehdet (Dashboard toimii, muut ovat merkitty "ei vielä rakennettu").
- `firestore.rules` versionhallinnassa alusta asti (vrt. vanha, jossa säännöt ovat vain konsolissa).

Puuttuu (rakennetaan seuraavaksi, ks. suunnitelma): purjehdusten/kalenterin hallinta, asiakkaat/yritykset, laskutus (ALV, PDF, sähköposti), täsmäytys, CSV-vienti, varmuuskopiointi, admin-työkalut, datan siirto vanhasta.

## Ennen kuin tämä toimii oikeasti

`js/firebase.js` sisältää vielä paikkamerkki-arvot. Sovellus näyttää "Firebase ei ole vielä konfiguroitu" -bannerin kunnes:

1. Uusi Firebase-projekti on luotu (katso `FIREBASE_SETUP.md`).
2. `js/firebase.js`:n `FIREBASE_CONFIG` on täytetty projektin oikeilla arvoilla.
3. `firestore.rules` on deployattu projektiin.

## Deploy

GitHub Pages, `.github/workflows/static.yml` — sama nolla-build-julkaisu kuin vanhassa: koko repo julkaistaan sellaisenaan pushista mainiin.
