import { Activity } from "./lib.mjs";

// AD-UC002 Place Online Order
export default function () {
  const d = new Activity("AD-UC002", {
    title: "Place Online Order",
    pre: "The Customer is signed in and the cart contains at least one product.",
    post: "An online order exists with status preparing and payment unpaid; no points are awarded yet.",
    lanes: ["Customer", "KACoffee System"],
    laneW: 300,
    rowH: 62,
  });
  const C = 0, S = 1;
  d.start("s", C, 0);
  d.action("cart", "Review the cart and select “Checkout”", C, 1);
  d.action("form", "Present branches, fulfilment methods and order summary", S, 1, { w: 190, h: 50 });
  d.action("branch", "Select branch and fulfilment method; enter recipient", C, 2, { w: 190, h: 50 });
  d.decision("dF", C, 3);
  d.action("addr", "Enter the delivery address", C, 4);
  d.decision("mF", C, 5);
  d.decision("dD", C, 6);
  d.action("code", "Enter a discount code and request a preview", C, 7, { w: 180, h: 50 });
  d.action("val", "Validate the discount code (UC023)", S, 7);
  d.decision("dV", S, 8);
  d.action("show", "Show the discount in the order summary", S, 9);
  d.action("conf", "Confirm the order", C, 10);
  d.action("check", "Check branch, products and delivery city; recalculate prices, code and fee", S, 11, { w: 220, h: 54 });
  d.decision("dC", S, 12);
  d.action("rec", "Record the order (online, preparing, unpaid); clear the cart and show its details", S, 13, { w: 220, h: 54 });
  d.end("e", S, 14);

  const gx = d.cx(C);
  d.flow("s", "cart");
  d.flow("cart", "form", "r", "l");
  d.flow("form", "branch", "b", "t");
  d.flow("branch", "dF");
  d.flow("dF", "addr", "b", "t", { label: "[delivery]", lx: -0.1, ox: 34 });
  d.edge("dF", "mF", [d.port("dF", "r"), [gx + 110, d.port("dF", "r")[1]], [gx + 110, d.port("mF", "r")[1]], d.port("mF", "r")], { label: "[pickup]", lx: -0.75, oy: -10 });
  d.flow("addr", "mF");
  d.flow("mF", "dD");
  d.flow("dD", "code", "b", "t", { label: "[has code]", lx: -0.1, ox: 36 });
  d.flow("code", "val", "r", "l");
  d.flow("val", "dV");
  d.loop("dV", "dD", d.cx(S) + 125, "r", "r", { label: "[invalid code]", lx: -1, ox: 48, oy: -11 });
  d.flow("dV", "show", "b", "t", { label: "[valid]", lx: -0.1, ox: 26 });
  d.flow("show", "conf", "b", "t");
  d.loop("dD", "conf", gx - 120, "l", "l", { label: "[no code]", lx: -1, ox: -32, oy: -11 });
  d.flow("conf", "check", "r", "t");
  d.flow("check", "dC");
  d.flow("dC", "rec", "b", "t", { label: "[valid]", lx: -1, ox: 46, oy: 2 });
  d.loop("dC", "branch", gx - 135, "l", "l", { label: "[rejected]", lx: -1, ox: -38, oy: -11 });
  d.flow("rec", "e");
  return d.finish(15);
}
