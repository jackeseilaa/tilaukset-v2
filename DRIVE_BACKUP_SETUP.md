# Drive-varmuuskopioinnin käyttöönotto

Sovellus voi tallentaa täyden JSON-varmuuskopion suoraan Google Driveen
("☁️ Vie Driveen" -nappi Dashboardilla), samalla tavalla kuin vanha
`jackeseilaa/tilaukset`-sovellus jo tekee. Tätä varten tarvitaan yksi
OAuth-client Google Cloud Consolessa — ilmainen, ei laskutusta.

Kohdekansio Drivessa on jo luotu: **"Tilaukset v2 varmuuskopiot"**
(https://drive.google.com/drive/folders/1WqMoBd27hoXnY5ERFT82uesXG7QRke68).

## 1. Ota Drive API käyttöön

1. Avaa https://console.cloud.google.com
2. Varmista oikeasta projektinvalitsimesta (ylhäällä) että projekti on
   **jsailing-tilaukset-v2** — sama projekti kuin Firebase.
3. Mene: https://console.cloud.google.com/apis/library/drive.googleapis.com
   (varmista taas oikea projekti valittuna) → **Enable**.

## 2. Luo OAuth-client

1. Mene: https://console.cloud.google.com/apis/credentials (oikea projekti
   valittuna)
2. Jos "OAuth consent screen" ei ole vielä konfiguroitu tälle projektille,
   Google pyytää sen ensin — valitse **External**, täytä pakolliset kentät
   (sovelluksen nimi esim. "Tilaukset v2", tukisähköposti
   jacke.seilaa@gmail.com, kehittäjän yhteystieto sama), tallenna. Ei
   tarvitse julkaista tuotantoon, riittää että jää "Testing"-tilaan ja
   jacke.seilaa@gmail.com lisätään testikäyttäjäksi jos kysytään.
3. **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Name: esim. "Tilaukset v2 backup"
6. **Authorized JavaScript origins** → **Add URI** →
   `https://jackeseilaa.github.io`
7. **Create**
8. Kopioi näkyviin tuleva **Client ID** (muotoa
   `123456789-xxxxxxxx.apps.googleusercontent.com`)

## 3. Anna Client ID minulle

Lähetä Client ID minulle (tai muokkaa itse `js/drive-config.js`:n
`DRIVE_OAUTH_CLIENT_ID`-arvoksi), niin julkaisen.

## Tunnetut sudenkuopat (törmätty vanhan sovelluksen kanssa 2026-07-24)

- **`origin_mismatch`-virhe:** "Authorized JavaScript origins" ei sisältänyt
  `https://jackeseilaa.github.io`:ia — tarkista kohta 2.6 yllä.
- **`SERVICE_DISABLED` (403):** Drive API ei ollut käytössä tälle projektille
  — tarkista kohta 1 yllä, ja että projekti oli oikea kun API otettiin
  käyttöön.

Client ID itsessään ei ole salaisuus — se on tarkoitettu näkymään selaimen
lähdekoodissa, todellinen suojaus tulee "Authorized JavaScript origins"
-rajauksesta (vain jackeseilaa.github.io saa käyttää sitä) ja siitä että
Drive-vienti vaatii joka kerta sinun oman Google-kirjautumisesi hyväksynnän.
