import { Activity } from "./lib.mjs";

// AD-UC010 Process Bottle Exchange
export default function () {
  const d = new Activity("AD-UC010", {
    title: "Process Bottle Exchange",
    pre: "Staff is signed in and assigned to a branch; an active bottled product exists.",
    post: "An exchange record exists for the branch with the reward quantity and the member, if identified.",
    lanes: ["Store Customer", "Staff", "KACoffee System"],
    laneWs: [210, 280, 280],
  });
  const K = 0, T = 1, S = 2;
  d.start("s", K, 0);
  d.action("hand", "Hand over the returned bottles", K, 1, { w: 160 });
  d.action("open", "Open the bottle exchange screen", T, 1);
  d.action("prod", "Display eligible bottled reward products", S, 2, { w: 180, h: 50 });
  d.action("enter", "Enter bottles, reward product and optional phone; submit", T, 3, { w: 190, h: 54 });
  d.action("check", "Check multiple of five, reward product and member", S, 4, { w: 190, h: 50 });
  d.decision("dV", S, 5);
  d.action("rec", "Calculate reward quantity and record the exchange", S, 6, { w: 190, h: 50 });
  d.action("show", "Display the recorded exchange", S, 7);
  d.action("give", "Hand the reward products to the customer", T, 8, { w: 180, h: 50 });
  d.end("e", T, 9);

  d.flow("s", "hand");
  d.flow("hand", "open", "r", "l");
  d.flow("open", "prod", "b", "t");
  d.flow("prod", "enter", "b", "t");
  d.flow("enter", "check", "r", "t");
  d.flow("check", "dV");
  d.loop("dV", "enter", d.cx(T) - 120, "l", "l", { label: "[invalid]", lx: -1, ox: -36, oy: -11 });
  d.flow("dV", "rec", "b", "t", { label: "[valid]", lx: -0.1, ox: 26 });
  d.flow("rec", "show");
  d.flow("show", "give", "b", "t");
  d.flow("give", "e");
  return d.finish(10);
}
