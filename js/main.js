import {createStore} from "./store.js";
import {initDispatch} from "./dispatch.js";
import {initialState} from "./state.js";
import {watchAuth} from "./auth.js";
import {startListeners, stopListeners} from "./listeners.js";
import {render} from "./ui/render.js";
import {CONFIG_READY} from "./firebase.js";

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
