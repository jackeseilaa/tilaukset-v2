import {collection, doc, onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {db} from "./firebase.js";

const COLLECTIONS = ["sailings", "customers", "companies", "invoices", "tutkinnot", "muutTuotteet", "kyselyt", "blockedDays"];

let unsubscribers = [];

export function startListeners(store) {
  for (const col of COLLECTIONS) {
    const unsub = onSnapshot(collection(db, col), snap => {
      store.setState({[col]: snap.docs.map(d => ({id: d.id, ...d.data()}))});
    });
    unsubscribers.push(unsub);
  }
  // meta/app: mm. viimeisin Drive-varmuuskopiointiaika, näkyy reaaliaikaisesti
  // kaikilla laitteilla.
  unsubscribers.push(onSnapshot(doc(db, "meta", "app"), snap => {
    store.setState({meta: snap.exists() ? snap.data() : {}});
  }));
  // meta/invoiceCounter: allocateInvoiceNumber()in Firestore-transaktion päivittämä
  // autoritatiivinen laskuri vuosittain — pidetään reaaliaikaisesti tilassa jotta
  // previewNextInvoiceNumber() ei jää jälkeen laskun poiston jälkeen (ks. muistio).
  unsubscribers.push(onSnapshot(doc(db, "meta", "invoiceCounter"), snap => {
    store.setState({invoiceCounter: snap.exists() ? snap.data() : {}});
  }));
}

export function stopListeners() {
  unsubscribers.forEach(u => u());
  unsubscribers = [];
}
