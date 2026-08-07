# Sähköpostilähetyksen käyttöönotto (Google Apps Script)

Tilaukset-v2 lähettää laskuja sähköpostilla oman Gmail-tilisi kautta ilmaisella
Google Apps Scriptillä — ei Firebase-laskutusta, ei luottokorttia.

## 1. Luo Apps Script -projekti

1. Avaa https://script.google.com samalla Google-tilillä jota käytät sovelluksessa
   (jacke.seilaa@gmail.com).
2. "Uusi projekti" (New project).
3. Nimeä projekti esim. "Tilaukset v2 — sähköpostilähetys".
4. Poista oletus-`Code.gs`:n sisältö ja liitä tilalle koko `Code.gs`-tiedoston
   sisältö tästä kansiosta (myös Drive-kopiona, jos kopiointi suoraan
   tiedostosta ei onnistu).
5. Tallenna (Ctrl+S).

## 2. Julkaise Web Appina

1. Oikeasta yläkulmasta **Deploy** → **New deployment**.
2. Type-valikosta (rataskuvake) valitse **Web app**.
3. Täytä:
   - **Execute as:** Me (oma tilisi)
   - **Who has access:** Anyone
4. **Deploy**.
5. Google saattaa pyytää valtuutusta ensimmäisellä kerralla — hyväksy omalla
   tilillä. Jos näet varoituksen "Google hasn't verified this app", se on
   normaalia omille skripteille — jatka **Advanced** → **Go to (projektin
   nimi) (unsafe)**.
6. Kopioi näkyviin tuleva **Web app URL** (muotoa
   `https://script.google.com/macros/s/.../exec`).

## 3. Liitä URL sovellukseen

Anna Web app URL minulle (tai muokkaa itse) tiedostoon
`js/email-config.js`, `EMAIL_WEBAPP_URL`-riville. Salasana (`EMAIL_SECRET`)
on jo valmiiksi sama molemmissa tiedostoissa (`Code.gs`:n `SHARED_SECRET` ja
`email-config.js`:n `EMAIL_SECRET`) — ei tarvitse muuttaa kumpaakaan, kunhan
et vaihda toista ilman toista.

## Rajat ja huomiot

- Ilmaisen Gmail-tilin lähetysraja on n. 100 vastaanottajaa/vuorokausi —
  reilusti riittävä tähän käyttöön.
- Jos joskus muutat `Code.gs`:ää, pitää tehdä **uusi** Deploy → Manage
  deployments → muokkaa olemassa olevaa (tai luo uusi versio) jotta muutos
  tulee voimaan — pelkkä tallennus editorissa ei riitä.
- URL ja salasana eivät ole kovin arkaluontoisia (sähköpostin lähetys omalta
  tililtä), mutta älä silti jaa niitä julkisesti.
