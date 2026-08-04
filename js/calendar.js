import {registerAction} from "./dispatch.js";
import {today} from "./format.js";

registerAction("cal-nav", ({el, store}) => { store.setState({calendarMonth: el.dataset.month}); });
registerAction("cal-today", ({store}) => { store.setState({calendarMonth: today().slice(0, 7), calDayDate: today()}); });
registerAction("cal-view", ({el, store}) => {
  const state = store.getState();
  store.setState({calView: el.dataset.view, calDayDate: (el.dataset.view === "day" && !state.calDayDate) ? today() : state.calDayDate});
});
registerAction("cal-day-open", ({date, store}) => { store.setState({calView: "day", calDayDate: date}); });
registerAction("cal-day-nav", ({date, store}) => { store.setState({calDayDate: date, calendarMonth: date.slice(0, 7)}); });
