import { Activity } from "./lib.mjs";

// AD-UC001 Register as Customer
export default function () {
  const d = new Activity("AD-UC001", {
    title: "Register as Customer",
    pre: "The Guest is not signed in and is on the KACoffee website.",
    post: "One customer account exists at the New rank with zero points, and the customer is signed in.",
    lanes: ["Guest", "KACoffee System"],
  });
  const G = 0, S = 1;
  d.start("s", G, 0);
  d.action("reg", "Select “Register”", G, 1);
  d.action("form", "Present registration form", S, 1);
  d.action("fill", "Fill out and submit the form", G, 2);
  d.action("val", "Validate required fields and lengths", S, 3);
  d.decision("d1", S, 4);
  d.action("phone", "Check that the phone number is not registered", S, 5, { w: 190, h: 48 });
  d.decision("d2", S, 6);
  d.action("create", "Create account (New rank, 0 points) and welcome notification", S, 7, { w: 200, h: 52 });
  d.action("tok", "Issue access and refresh tokens", S, 8);
  d.action("area", "Open the member area", S, 9);
  d.end("e", S, 10);

  d.flow("s", "reg");
  d.flow("reg", "form", "r", "l");
  d.flow("form", "fill", "b", "t");
  d.flow("fill", "val", "r", "t");
  d.flow("val", "d1");
  d.flow("d1", "phone", "b", "t", { label: "[valid]", lx: -0.2, ox: 28 });
  d.loop("d1", "fill", d.cx(G) - 115, "l", "l", { label: "[invalid data]", lx: -1, ox: -62, oy: -11 });
  d.flow("phone", "d2");
  d.flow("d2", "create", "b", "t", { label: "[not registered]", lx: -0.2, ox: 52 });
  d.loop("d2", "fill", d.cx(G) - 130, "l", "l", { label: "[duplicate phone]", lx: -1, ox: -62, oy: -11 });
  d.flow("create", "tok");
  d.flow("tok", "area");
  d.flow("area", "e");
  return d.finish(11);
}
