import {collection, doc, addDoc, setDoc, deleteDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {db} from "./firebase.js";

// Ohuet Firestore-kirjoitusapurit — sama muoto kuin vanhassa sovelluksessa
// (fsAdd/fsSet/fsDel), jotta jokaisen domain-moduulin CRUD-koodi näyttää tutulta.
export async function fsAdd(col, data, store) {
  if (!db) return null;
  store?.setState({syncing: true});
  try {
    const ref = await addDoc(collection(db, col), {...data, updatedAt: serverTimestamp()});
    return ref.id;
  } finally {
    store?.setState({syncing: false});
  }
}

export async function fsSet(col, id, data, store) {
  if (!db) return;
  store?.setState({syncing: true});
  try {
    await setDoc(doc(db, col, id), {...data, updatedAt: serverTimestamp()}, {merge: true});
  } finally {
    store?.setState({syncing: false});
  }
}

export async function fsDel(col, id, store) {
  if (!db) return;
  store?.setState({syncing: true});
  try {
    await deleteDoc(doc(db, col, id));
  } finally {
    store?.setState({syncing: false});
  }
}
