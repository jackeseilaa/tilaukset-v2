# Firebase-projektin käyttöönotto (tehtävä käsin)

Nämä vaiheet vaativat oman Google/Firebase-kirjautumisen ja (vaiheessa 3) laskutustiedot, joten en voi tehdä niitä puolestasi — mutta ne pitää tehdä ennen kuin uusi sovellus oikeasti toimii. Kun olet tehnyt vaiheet 1-6, kerro minulle arvot, niin täytän `js/firebase.js`:n ja päivitän `.firebaserc`:n.

## 1. Luo uusi Firebase-projekti

- console.firebase.google.com → "Lisää projekti" → esim. nimi "jsailing-tilaukset-v2" (ei tarvitse olla sama kuin repo-nimi).
- Ei tarvitse liittää Google Analyticsiä.

## 2. Ota Firestore käyttöön

- Projektin sivulta → Firestore Database → Luo tietokanta → **Natiivi-tila** (ei Datastore-tila) → valitse sijainniksi `europe-west1` (sama alue kuin Cloud Function tulee käyttämään).
- Aloita "tuotantotilassa" (säännöt joka tapauksessa korvataan repon `firestore.rules`:lla).

## 3. Ota Authentication käyttöön

- Authentication → Get started → Sign-in method → **Google** → ota käyttöön.
- Authentication → Settings → Authorized domains → lisää uuden GitHub Pages -osoitteen domain (`jackeseilaa.github.io` on todennäköisesti jo listalla vanhasta sovelluksesta samalta tililtä, mutta tarkista).

## 4. Hae web-sovelluksen asetukset

- Projektin asetukset (rataskuvake) → "Omat sovellukset" → Lisää sovellus → Web (</>) → nimeä esim. "tilaukset-v2".
- Kopioi näkyviin tuleva `firebaseConfig`-olio (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) — anna nämä minulle, täytän `js/firebase.js`:ään.

## 5. Deployaa Firestore-säännöt

Kun `firebase`-työkalu on käytettävissä (tällä koneella ei ole Node/npm asennettuna juuri nyt — tarvitset joko Node.js:n asennuksen tähän koneeseen, tai voit ajaa tämän toiselta koneelta/Cloud Shellistä):

```
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <PROJEKTI-ID>
```

## 6. Blaze-laskutussuunnitelma (vasta kun Cloud Function -sähköpostilähetys rakennetaan)

Laskun lähetys sähköpostilla vaatii Cloud Functionin, joka vaatii Blaze (pay-as-you-go) -suunnitelman. Tällä käyttömäärällä (muutama lasku/kk) kustannus on käytännössä nolla, mutta Firebase pyytää luottokortin lisäystä konsolissa. Tämä vaihe tehdään vasta kun laskutus-välilehteä aletaan rakentaa — ei tarvitse tehdä heti.

Lisäksi tarvitaan tällöin **uusi** Gmail-sovellussalasana (myaccount.google.com → Turvallisuus → 2-vaiheinen vahvistus → Sovellussalasanat) — vanhan sovelluksen salasana ei toimi uudessa projektissa.

## 7. GitHub Pages

Kun repo on luotu ja pushattu (teen tämän puolestasi), mene reposta Settings → Pages → Source: "Deploy from a branch" → Branch: main / (root) → Save. Tämän jälkeen `.github/workflows/static.yml` hoitaa julkaisun automaattisesti jokaisen pushin jälkeen.
