import { Activity } from "./lib.mjs";

// AD-UC003 Create Staff-Assisted Order
export default function () {
  const d = new Activity("AD-UC003", {
    title: "Create Staff-Assisted Order",
    pre: "Staff is signed in and assigned to a branch.",
    post: "An in-store or phone order exists in the staff member's branch with status preparing and payment unpaid.",
    lanes: ["Store Customer / Caller", "Staff", "KACoffee System"],
    laneWs: [210, 280, 280],
    rowH: 62,
  });
  const K = 0, T = 1, S = 2;
  d.start("s", K, 0);
  d.action("tell", "Tell the staff member the order", K, 1, { w: 160 });
  d.action("pos", "Open the POS screen and select the order source", T, 1, { w: 180, h: 50 });
  d.action("prod", "Display products available in store", S, 2);
  d.action("items", "Select products, quantities and drink options", T, 3, { w: 180, h: 50 });
  d.action("sub", "Update line items and subtotal", S, 4);
  d.decision("dM", T, 5);
  d.action("phone", "Enter the member's phone number", T, 6);
  d.action("look", "Look up the member (UC024)", S, 6);
  d.decision("dF", S, 7);
  d.action("mem", "Display member rank and points", S, 8);
  d.action("recip", "Enter recipient, fulfilment method and discount code", T, 9, { w: 190, h: 50 });
  d.action("conf", "Confirm the order", T, 10);
  d.action("val", "Validate products, delivery data, member and code (UC023); calculate total", S, 11, { w: 210, h: 54 });
  d.decision("dV", S, 12);
  d.action("rec", "Record the order in the staff member's branch (preparing, unpaid) and display it", S, 13, { w: 220, h: 54 });
  d.end("e", S, 14);

  const tx = d.cx(T);
  d.flow("s", "tell");
  d.flow("tell", "pos", "r", "l");
  d.flow("pos", "prod", "b", "t");
  d.flow("prod", "items", "b", "t");
  d.flow("items", "sub", "r", "t");
  d.flow("sub", "dM", "b", "t");
  d.flow("dM", "phone", "b", "t", { label: "[member]", lx: -0.1, ox: 32 });
  d.flow("phone", "look", "r", "l");
  d.flow("look", "dF");
  d.loop("dF", "dM", d.cx(S) + 120, "r", "r", { label: "[not found]", lx: -1, ox: 42, oy: -11 });
  d.flow("dF", "mem", "b", "t", { label: "[found]", lx: -0.1, ox: 26 });
  d.flow("mem", "recip", "b", "t");
  d.loop("dM", "recip", tx - 120, "l", "l", { label: "[not a member]", lx: -1, ox: -56, oy: -11 });
  d.flow("recip", "conf");
  d.flow("conf", "val", "r", "t");
  d.flow("val", "dV");
  d.loop("dV", "recip", d.cx(S) + 125, "r", "r", { label: "[rejected]", lx: -1, ox: 38, oy: -11 });
  d.flow("dV", "rec", "b", "t", { label: "[valid]", lx: -1, ox: 46, oy: 2 });
  d.flow("rec", "e");
  return d.finish(15);
}
