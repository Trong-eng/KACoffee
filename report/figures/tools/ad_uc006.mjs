import { Activity } from "./lib.mjs";

// AD-UC006 Log In (UC007 is exported from ad_uc007.mjs)
export default function () {
  const d = new Activity("AD-UC006", {
    title: "Log In",
    pre: "The user has an active customer or employee account.",
    post: "The user is authenticated and the work area of the user's role is displayed.",
    lanes: ["User", "KACoffee System"],
  });
  const U = 0, S = 1;
  d.start("s", U, 0);
  d.action("open", "Open the sign-in page of the user group", U, 1);
  d.action("form", "Present the login form", S, 1);
  d.action("enter", "Enter credentials and submit", U, 2);
  d.action("verify", "Verify that an active account matches the credentials", S, 3, { w: 190, h: 50 });
  d.decision("d1", S, 4);
  d.action("tok", "Issue access and refresh tokens; load profile and role", S, 5, { w: 190, h: 50 });
  d.action("area", "Open the work area of the user's role", S, 6);
  d.end("e", S, 7);

  d.flow("s", "open");
  d.flow("open", "form", "r", "l");
  d.flow("form", "enter", "b", "t");
  d.flow("enter", "verify", "r", "t");
  d.flow("verify", "d1");
  d.flow("d1", "tok", "b", "t", { label: "[valid]", lx: -0.2, ox: 28 });
  d.loop("d1", "enter", d.cx(U) - 115, "l", "l", { label: "[invalid]", lx: -1, ox: -36, oy: -11 });
  d.flow("tok", "area");
  d.flow("area", "e");
  return d.finish(8);
}
