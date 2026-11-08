import { Sequence } from "./seq.mjs";

// SD-UC007 Log Out
export default function () {
  const s = new Sequence("SD-UC007", {
    title: "UC007",
    parts: [
      { id: "u", kind: "actor", name: "User" },
      { id: "hdr", kind: "boundary", name: "AppHeader" },
      { id: "ses", kind: "control", name: "SessionController" },
      { id: "pg", kind: "boundary", name: "ProtectedPage" },
    ],
    gaps: [130, 150, 150],
  });
  s.call("u", "hdr", "selectLogOut()");
  s.call("hdr", "ses", "logOut()");
  s.self("ses", "clearTokensAndProfile()");
  s.opt("the current page is protected", () => {
    s.call("ses", "pg", "sessionEnded()");
    s.self("pg", "redirectToSignIn()");
    s.ret("pg", "ses", "");
  });
  s.ret("ses", "hdr", "session cleared");
  s.ret("hdr", "u", "signed-out header");
  return s.finish();
}
