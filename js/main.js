import {createStore} from "./store.js";
import {initDispatch} from "./dispatch.js";
import {initialState} from "./state.js";
import {watchAuth} from "./auth.js";
import {startListeners, stopListeners} from "./listeners.js";
import {render} from "./ui/render.js";
import {CONFIG_READY} from "./firebase.js";

// Domain-moduulit rekisteröivät omat toimintonsa (registerAction) sivuvaikutuksena
// tuontihetkellä — tässä ei kutsuta mitään niistä suoraan.
import "./companies.js";
import "./muut-tuotteet.js";
import "./kyselyt.js";
import "./blocked-days.js";
import "./sailings.js";
import "./calendar.js";
import "./customers.js";
import "./invoices.js";
import "./tutkinnot.js";
import "./admin.js";
import "./backup.js";

const store = createStore(initialState);
const appEl = document.getElementById("app");

initDispatch(appEl, store);
store.subscribe(() => render(store));

if (CONFIG_READY) {
  watchAuth(user => {
    store.setState({user});
    if (user) startListeners(store);
    else stopListeners();
  });
} else {
  render(store);
}
