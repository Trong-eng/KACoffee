import { Sequence } from "./seq.mjs";

// SD-UC006 Log In
export default function () {
  const s = new Sequence("SD-UC006", {
    title: "UC006",
    parts: [
      { id: "u", kind: "actor", name: "User" },
      { id: "ui", kind: "boundary", name: "LoginPage" },
      { id: "ctl", kind: "control", name: "LoginController" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "emp", kind: "entity", name: "Employee" },
      { id: "tok", kind: "entity", name: "RefreshToken" },
    ],
    gaps: [130, 150, 140, 120, 110],
  });
  s.callRet("u", "ui", "openSignIn(portal)", "login form");
  s.call("u", "ui", "submit(credentials)");
  s.call("ui", "ctl", "logIn(portal, credentials)");
  s.alt(
    ["customer portal", () => s.callRet("ctl", "cus", "findActiveByPhone(phone)", "customer | null")],
    ["employee portal", () => s.callRet("ctl", "emp", "findActiveByUsername(name)", "employee | null")],
  );
  s.self("ctl", "verifyPassword(password)");
  s.alt(
    ["no active account or wrong password", () => {
      s.ret("ctl", "ui", "error: invalid credentials", { end: false });
      s.ret("ui", "u", "\"Invalid credentials\"", { end: false });
    }],
    ["credentials valid", () => {
      s.callRet("ctl", "tok", "store(refreshTokenHash)", "stored");
      s.ret("ctl", "ui", "tokens, profile, role");
      s.self("ui", "saveSession(tokens, profile)");
      s.ret("ui", "u", "work area of the role");
    }],
  );
  return s.finish();
}
