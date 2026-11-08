import { Sequence } from "./seq.mjs";

// SD-UC010 Process Bottle Exchange
export default function () {
  const s = new Sequence("SD-UC010", {
    title: "UC010",
    parts: [
      { id: "st", kind: "actor", name: "Staff" },
      { id: "ui", kind: "boundary", name: "BottleExchangeScreen" },
      { id: "ctl", kind: "control", name: "BottleExchangeController" },
      { id: "pr", kind: "entity", name: "Product" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "bx", kind: "entity", name: "BottleExchange" },
      { id: "aud", kind: "entity", name: "AuditLog" },
    ],
    gaps: [150, 170, 130, 100, 100, 95],
  });
  s.call("st", "ui", "openBottleExchange()");
  s.call("ui", "ctl", "getRewardProducts()");
  s.callRet("ctl", "pr", "findActiveBottled()", "bottled products");
  s.ret("ctl", "ui", "products");
  s.ret("ui", "st", "exchange form");
  s.call("st", "ui", "submit(exchangeData)");
  s.call("ui", "ctl", "processExchange(request)");
  s.self("ctl", "checkMultipleOfFive(bottles)");
  s.callRet("ctl", "pr", "find(productId)", "product");
  s.opt("phone number entered", () => s.callRet("ctl", "cus", "findActiveByPhone(phone)", "customer | null"));
  s.alt(
    ["invalid quantity, product or member", () => {
      s.ret("ctl", "ui", "error: reason", { end: false });
      s.ret("ui", "st", "show reason", { end: false });
    }],
    ["exchange valid", () => {
      s.self("ctl", "reward = bottles / 5");
      s.callRet("ctl", "bx", "create(branch, staff, member, reward)", "exchange");
      s.callRet("ctl", "aud", "record(exchange)", "entry");
      s.ret("ctl", "ui", "exchange");
      s.ret("ui", "st", "exchange, reward quantity");
    }],
  );
  return s.finish();
}
