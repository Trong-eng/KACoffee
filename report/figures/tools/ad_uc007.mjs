import { Activity } from "./lib.mjs";

// AD-UC007 Log Out
export default function () {
  const d = new Activity("AD-UC007", {
    title: "Log Out",
    pre: "The user is signed in.",
    post: "The session is ended on the browser.",
    lanes: ["User", "KACoffee System"],
    laneW: 260,
  });
  const U = 0, S = 1;
  d.start("s", U, 0);
  d.action("sel", "Select “Log Out”", U, 1);
  d.action("clear", "Remove stored tokens and profile from the browser", S, 1, { w: 190, h: 50 });
  d.action("show", "Show the signed-out header; protected pages redirect to sign-in", S, 2, { w: 190, h: 54 });
  d.end("e", S, 3);
  d.flow("s", "sel");
  d.flow("sel", "clear", "r", "l");
  d.flow("clear", "show");
  d.flow("show", "e");
  return d.finish(4);
}
