# J Sailing — Tilaukset v2 (hallintapaneeli)

Tilaus- ja laskutushallinta Absolut 37 -purjehdusristeilyille (vene s/y Quartet, J Sailing Tmi / AJarmo Oy), rakennettu alusta alkaen erilliseksi projektiksi vanhan [`tilaukset`](https://github.com/jackeseilaa/tilaukset)-sovelluksen rinnalle. Vanha sovellus pysyy koskemattomana ja rinnalla käytössä.

**Miksi tämä on olemassa:** vanha sovellus on yksi 345 kt:n tiedosto, 400+ committia, kertynyttä monimutkaisuutta. Tämä on sama toiminnallisuus uudelleenkirjoitettuna moduuleiksi jaettuna, samalla Firebase/Firestore-reaaliaikaisuudella, mutta ilman build-työkalua (ei npm/Vite/React selaimessa — pelkkä `<script type="module">`, sama nolla-build GitHub Pages -julkaisu kuin vanhassa).

## Tila: käytössä, V1.11.5 (päivitetty 2026-10-05)

Tehty:
- Kirjautuminen (Google, rajattu `jacke.seilaa@gmail.com`), reaaliaikainen Firestore-kytkentä kokoelmille + `meta`.
- Tilasäiliö (`js/store.js`) + toimintorekisteri/tapahtumadelegointi (`js/dispatch.js`) — korvaa vanhan 950-rivisen `bind()`-funktion ja 115-haaraisen if-ketjun.
- Purjehdusten ja kalenterin hallinta, estetyt päivät (`js/sailings.js`, `js/calendar.js`, `js/blocked-days.js`).
- Asiakkaat, yritykset, muut tuotteet ja kyselyt (`js/customers.js`, `js/companies.js`, `js/muut-tuotteet.js`, `js/kyselyt.js`).
- Laskutus: ALV-kannan valinta, maksuehto/eräpäivä, yhdistetyt laskut usealle purjehdukselle, PDF-lasku (`js/invoices.js`, `js/vat.js`, `js/pdf.js`).
- Kirjanpito: kuukausikohtainen erittely yrityksittäin, PDF-lataus sivunvaihdolla yhtiöiden välissä.
- Tutkinnot, CSV-vienti, varmuuskopiointi (myös Google Driveen, ks. `DRIVE_BACKUP_SETUP.md`) ja admin-työkalut (`js/tutkinnot.js`, `js/csv.js`, `js/backup.js`, `js/drive-backup.js`, `js/admin.js`).
- `firestore.rules` versionhallinnassa alusta asti (vrt. vanha, jossa säännöt ovat vain konsolissa).

Ajantasainen tilanne kannattaa tarkistaa `git log`-historiasta — tämä lista jää itsekin helposti jälkeen.

## Käyttöönotto

`js/firebase.js` sisältää jo tuotantoprojektin (`jsailing-tilaukset-v2`) oikeat arvot, joten sovellus toimii sellaisenaan. Jos konfiguroit uuden Firebase-projektin (esim. toista ympäristöä varten), katso `FIREBASE_SETUP.md` ja muista deployata `firestore.rules` uuteen projektiin.

## Deploy

GitHub Pages, `.github/workflows/static.yml` — sama nolla-build-julkaisu kuin vanhassa: koko repo julkaistaan sellaisenaan pushista mainiin.
