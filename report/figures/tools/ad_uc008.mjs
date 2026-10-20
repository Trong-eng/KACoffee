import { Activity } from "./lib.mjs";

// AD-UC008 Update Store Order Status
export default function () {
  const d = new Activity("AD-UC008", {
    title: "Update Store Order Status",
    pre: "Staff is signed in; the order belongs to the staff member's branch.",
    post: "The order has a new status and a status history entry.",
    lanes: ["Staff", "KACoffee System"],
    laneWs: [260, 560],
  });
  const T = 0, S = 1;
  d.start("s", T, 0);
  d.action("open", "Open the order status screen", T, 1);
  d.action("list", "Display the branch's orders and their status", S, 1, { w: 190, h: 50 });
  d.action("sel", "Select an order and choose the new status", T, 2, { w: 180, h: 50 });
  d.action("check", "Check the branch and that the transition is allowed", S, 3, { w: 200, h: 50 });
  d.decision("d1", S, 4);
  d.end("e0", S, 4, { dx: 150 });
  d.action("upd", "Update the status; record history and audit log", S, 5, { w: 200, h: 50 });
  d.decision("dS", S, 6);
  d.action("ready", "Notify the member; create a delivery record for delivery orders", S, 7.3, { w: 160, h: 64, dx: -180 });
  d.action("canc", "Set the payment status to cancelled", S, 7.3, { w: 150, h: 64 });
  d.action("comp", "Record payment as paid; award member points (UC025)", S, 7.3, { w: 160, h: 64, dx: 180 });
  d.decision("m", S, 8.8);
  d.action("show", "Display the updated order", S, 9.8);
  d.end("e", S, 10.8);

  d.flow("s", "open");
  d.flow("open", "list", "r", "l");
  d.flow("list", "sel", "b", "t");
  d.flow("sel", "check", "r", "t");
  d.flow("check", "d1");
  d.flow("d1", "upd", "b", "t", { label: "[allowed]", lx: -0.1, ox: 32 });
  d.loop("d1", "sel", d.cx(T) - 115, "l", "l", { label: "[not allowed]", lx: -1, ox: -50, oy: -11 });
  d.flow("d1", "e0", "r", "l", { label: "[other branch]", lx: 0, oy: -11 });
  d.flow("upd", "dS");
  d.flow("dS", "ready", "l", "t", { label: "[ready]", lx: -0.55, oy: -10 });
  d.flow("dS", "canc", "b", "t", { label: "[cancelled]", lx: -0.1, ox: 38 });
  d.flow("dS", "comp", "r", "t", { label: "[completed, pickup only]", lx: -0.3, oy: -10 });
  d.flow("ready", "m", "b", "l");
  d.flow("canc", "m", "b", "t");
  d.flow("comp", "m", "b", "r");
  d.flow("m", "show");
  d.flow("show", "e");
  return d.finish(11.8);
}
