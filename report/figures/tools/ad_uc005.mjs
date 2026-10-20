import { Activity } from "./lib.mjs";

// AD-UC005 Update Delivery Status
export default function () {
  const d = new Activity("AD-UC005", {
    title: "Update Delivery Status",
    pre: "The Shipper is signed in; the delivery is assigned to this shipper.",
    post: "Delivered: the order is completed and paid and member points are credited once. Failed: the order stays ready for reassignment.",
    lanes: ["Shipper", "KACoffee System"],
    laneWs: [290, 480],
    rowH: 68,
  });
  const H = 0, S = 1;
  const M = 95, F = -125; // main and failure columns of the system lane
  d.start("s", H, 0);
  d.action("open", "Open the deliveries list", H, 1);
  d.action("list", "Display assigned deliveries with address and items", S, 1, { w: 200, h: 50, dx: M });
  d.decision("dE", S, 2, { dx: M });
  d.end("e0", S, 2, { dx: M + 100 });
  d.action("pick", "Collect the order and confirm pickup", H, 3);
  d.action("sp", "Set picked up; record time and history", S, 3, { w: 200, dx: M });
  d.action("start", "Confirm the start of the delivery", H, 4);
  d.action("sd", "Set delivering; record time and history", S, 4, { w: 200, dx: M });
  d.decision("dO", H, 5);
  d.action("hand", "Hand over, collect payment and confirm success", H, 6, { w: 190, h: 50 });
  d.action("ok", "Set delivery delivered; set order completed and paid", S, 6, { w: 200, h: 50, dx: M });
  d.decision("dP", S, 7, { dx: M });
  d.action("pts", "Award loyalty points; upgrade rank if reached (UC025)", S, 8, { w: 200, h: 50, dx: M });
  d.decision("mP", S, 9, { dx: M });
  d.action("show", "Display the updated delivery", S, 10, { w: 200, dx: M });
  d.end("e1", S, 11, { dx: M });
  d.action("fail", "Enter the failure reason and report a failed delivery", H, 8, { w: 190, h: 50 });
  d.action("sf", "Set delivery failed; keep order ready; notify member", S, 8, { w: 170, h: 54, dx: F });
  d.end("e2", S, 9.3, { dx: F });
  d.comment("n1", "A failure can also be reported before pickup or before the delivery starts (alternative flow A3).", H, 10.2, { w: 200, h: 62 });

  const hx = d.cx(H), sx = d.cx(S, M);
  d.flow("s", "open");
  d.flow("open", "list", "r", "l");
  d.flow("list", "dE");
  d.flow("dE", "e0", "r", "l", { label: "[none]", lx: 0, oy: -11 });
  d.flow("dE", "pick", "b", "t", { label: "[has deliveries]", lx: -1, ox: 56, oy: 14 });
  d.flow("pick", "sp", "r", "l");
  d.flow("sp", "start", "b", "t");
  d.flow("start", "sd", "r", "l");
  d.flow("sd", "dO", "b", "t");
  d.flow("dO", "hand", "b", "t", { label: "[delivered]", lx: -0.1, ox: 36 });
  d.loop("dO", "fail", hx - 125, "l", "l", { label: "[cannot deliver]", lx: -1, ox: -52, oy: -11 });
  d.flow("hand", "ok", "r", "l");
  d.flow("ok", "dP");
  d.flow("dP", "pts", "b", "t", { label: "[member, no points yet]", lx: -0.1, ox: -76 });
  d.edge("dP", "mP", [d.port("dP", "r"), [sx + 125, d.port("dP", "r")[1]], [sx + 125, d.port("mP", "r")[1]], d.port("mP", "r")], { label: "[otherwise]", lx: -0.78, oy: -10 });
  d.flow("pts", "mP");
  d.flow("mP", "show");
  d.flow("show", "e1");
  d.flow("fail", "sf", "r", "l");
  d.flow("sf", "e2");
  d.flow("n1", "fail", "t", "b", { endArrow: "none", dashed: true });
  return d.finish(12);
}
