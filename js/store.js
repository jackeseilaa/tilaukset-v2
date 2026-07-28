// Pieni tilasäiliö: yksi totuuden lähde + tilaajat.
// setState() kokoaa saman tapahtumasilmukan aikana tehdyt useat muutokset
// yhdeksi render()-kutsuksi (requestAnimationFrame), jotta jokaisen
// toiminnon perässä ei tarvitse itse muistaa kutsua render()-funktiota.
export function createStore(initialState) {
  const state = initialState;
  const subscribers = [];
  let renderScheduled = false;

  function notify() {
    renderScheduled = false;
    for (const fn of subscribers) fn(state);
  }

  function scheduleNotify() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(notify);
  }

  return {
    getState() { return state; },
    setState(patch) {
      Object.assign(state, typeof patch === "function" ? patch(state) : patch);
      scheduleNotify();
    },
    // Mutaatio suoraan state-oliolle (esim. state.sailingDraft.name=...) ilman
    // setState-kutsua vaatii tämän: merkitsee vain että render() pitää ajaa.
    touch() { scheduleNotify(); },
    subscribe(fn) { subscribers.push(fn); }
  };
}
