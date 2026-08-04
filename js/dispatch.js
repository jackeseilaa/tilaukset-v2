// Toimintorekisteri + tapahtumien delegointi.
// Vanhassa sovelluksessa jokaiseen [data-action]-elementtiin sidottiin oma
// onclick joka renderin jälkeen uudelleen (n. 950 riviä bind()-koodia,
// 115-haarainen if-ketju). Täällä sama asia hoidetaan kahdella pysyvällä
// kuuntelijalla juuritason #app-elementissä: koska #app itse ei koskaan
// korvaudu (vain sen sisältö innerHTML:llä), kuuntelijoita ei tarvitse
// koskaan sitoa uudelleen.
const actions = new Map();

export function registerAction(name, handler) {
  actions.set(name, handler);
}

function readCtx(el) {
  return {
    el,
    id: el.dataset.id ?? null,
    idx: (el.dataset.idx !== undefined && el.dataset.idx !== "") ? Number(el.dataset.idx) : null,
    date: el.dataset.date ?? null,
    type: el.dataset.type ?? null
  };
}

export function initDispatch(rootEl, store) {
  rootEl.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "LABEL") return;
    const handler = actions.get(el.dataset.action);
    if (!handler) return;
    e.stopPropagation();
    await handler({...readCtx(el), e, store});
  });

  // data-bind="polku.kentta" -kentät kirjoittavat suoraan state-olion polkuun
  // ilman että jokaiselle kentälle pitää käsin kirjoittaa oma addEventListener.
  // store.touch() pyytää uudelleenrenderöinnin (esim. hakukentät jotka
  // suodattavat listaa elävästi) — render.js palauttaa fokuksen ja
  // kursorin kohdan data-bind-attribuutin perusteella, joten kirjoitettu
  // teksti ei katoa vaikka renderöinti ajetaan jokaisella näppäimellä.
  const bindHandler = (e) => {
    const el = e.target.closest("[data-bind]");
    if (!el) return;
    setPath(store.getState(), el.dataset.bind, el.type === "checkbox" ? el.checked : el.value);
    store.touch();
  };
  rootEl.addEventListener("input", bindHandler);
  rootEl.addEventListener("change", bindHandler);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}
