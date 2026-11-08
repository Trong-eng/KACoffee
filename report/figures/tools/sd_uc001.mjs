import { Sequence } from "./seq.mjs";

// SD-UC001 Register as Customer
export default function () {
  const s = new Sequence("SD-UC001", {
    title: "UC001",
    parts: [
      { id: "g", kind: "actor", name: "Guest" },
      { id: "ui", kind: "boundary", name: "RegistrationPage" },
      { id: "ctl", kind: "control", name: "RegisterController" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "rank", kind: "entity", name: "MembershipRank" },
      { id: "ntf", kind: "entity", name: "Notification" },
      { id: "tok", kind: "entity", name: "RefreshToken" },
    ],
    gaps: [120, 130, 120, 100, 100, 100],
  });
  s.callRet("g", "ui", "openRegistration()", "registration form");
  s.call("g", "ui", "submit(registrationData)");
  s.self("ui", "validateFields()");
  s.alt(
    ["data missing or invalid", () => {
      s.ret("ui", "g", "show field errors", { end: false });
    }],
    ["data valid", () => {
      s.call("ui", "ctl", "register(registrationData)");
      s.callRet("ctl", "cus", "findByPhone(phone)", "customer | null");
      s.alt(
        ["phone already registered", () => {
          s.ret("ctl", "ui", "error: phone registered", { end: false });
          s.ret("ui", "g", "show error", { end: false });
        }],
        ["phone is new", () => {
          s.callRet("ctl", "rank", "getDefaultRank()", "New rank");
          s.callRet("ctl", "cus", "create(data, rank, 0 points)", "customer");
          s.callRet("ctl", "ntf", "createWelcome(customer)", "notification");
          s.callRet("ctl", "tok", "store(refreshTokenHash)", "stored");
          s.ret("ctl", "ui", "access + refresh tokens");
          s.self("ui", "saveSession(tokens)");
          s.ret("ui", "g", "member area");
        }],
      );
    }],
  );
  return s.finish();
}
