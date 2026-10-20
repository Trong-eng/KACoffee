import { Activity } from "./lib.mjs";

// AD-UC004 Manage Discount Codes
export default function () {
  const d = new Activity("AD-UC004", {
    title: "Manage Discount Codes",
    pre: "The Admin is signed in with the admin role.",
    post: "A new active discount code exists with zero or more eligible ranks.",
    lanes: ["Admin", "KACoffee System"],
    laneW: 290,
  });
  const A = 0, S = 1;
  d.start("s", A, 0);
  d.action("open", "Open the discount codes page", A, 1);
  d.action("list", "Display existing codes and the creation form with ranks", S, 1, { w: 200, h: 50 });
  d.action("enter", "Enter code, description, type, value and minimum order value", A, 2, { w: 200, h: 50 });
  d.decision("dR", A, 3);
  d.action("ranks", "Select the eligible ranks", A, 4);
  d.decision("mR", A, 5);
  d.action("sub", "Submit the form", A, 6);
  d.action("val", "Normalise the code, validate fields and check uniqueness", S, 7, { w: 200, h: 50 });
  d.decision("dV", S, 8);
  d.action("save", "Save the active code with its rank links", S, 9);
  d.action("done", "Show success, refresh the list and reset the form", S, 10, { w: 190, h: 50 });
  d.end("e", S, 11);

  const ax = d.cx(A);
  d.flow("s", "open");
  d.flow("open", "list", "r", "l");
  d.flow("list", "enter", "b", "t");
  d.flow("enter", "dR");
  d.flow("dR", "ranks", "b", "t", { label: "[restrict by rank]", lx: -0.1, ox: 56 });
  d.edge("dR", "mR", [d.port("dR", "r"), [ax + 115, d.port("dR", "r")[1]], [ax + 115, d.port("mR", "r")[1]], d.port("mR", "r")], { label: "[no rank]", lx: -0.75, oy: -10 });
  d.flow("ranks", "mR");
  d.flow("mR", "sub");
  d.flow("sub", "val", "r", "t");
  d.flow("val", "dV");
  d.loop("dV", "enter", ax - 125, "l", "l", { label: "[duplicate or\ninvalid]", lx: -1, ox: -50, oy: -18 });
  d.flow("dV", "save", "b", "t", { label: "[valid]", lx: -0.1, ox: 26 });
  d.flow("save", "done");
  d.flow("done", "e");
  return d.finish(12);
}
