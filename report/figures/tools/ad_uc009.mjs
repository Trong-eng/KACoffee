import { Activity } from "./lib.mjs";

// AD-UC009 Assign Delivery
export default function () {
  const d = new Activity("AD-UC009", {
    title: "Assign Delivery",
    pre: "The Manager or Admin is signed in; the related order is a ready delivery order.",
    post: "The delivery is assigned to one shipper of the order's branch.",
    lanes: ["Manager", "KACoffee System"],
    laneWs: [280, 380],
  });
  const M = 0, S = 1;
  d.start("s", M, 0);
  d.action("open", "Open the deliveries screen", M, 1);
  d.action("list", "Display deliveries in scope with status and shipper", S, 1, { w: 200, h: 50, dx: -40 });
  d.action("sel", "Select a delivery and choose an active shipper", M, 2, { w: 180, h: 50 });
  d.action("check", "Check branch, ready delivery order and shipper", S, 3, { w: 200, h: 50, dx: -40 });
  d.decision("d1", S, 4, { dx: -40 });
  d.end("e0", S, 4, { dx: 130 });
  d.action("asg", "Assign the shipper; record history and audit log", S, 5, { w: 200, h: 50, dx: -40 });
  d.action("show", "Display the updated delivery", S, 6, { w: 200, dx: -40 });
  d.end("e", S, 7, { dx: -40 });

  d.flow("s", "open");
  d.flow("open", "list", "r", "l");
  d.flow("list", "sel", "b", "t");
  d.flow("sel", "check", "r", "t");
  d.flow("check", "d1");
  d.flow("d1", "asg", "b", "t", { label: "[valid]", lx: -0.1, ox: 26 });
  d.loop("d1", "sel", d.cx(M) - 115, "l", "l", { label: "[invalid shipper]", lx: -1, ox: -62, oy: -11 });
  d.flow("d1", "e0", "r", "l", { label: "[other branch or\norder not ready]", lx: 0, oy: -20 });
  d.flow("asg", "show");
  d.flow("show", "e");
  return d.finish(8);
}
