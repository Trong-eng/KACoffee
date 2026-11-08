import { Sequence } from "./seq.mjs";

// SD-UC003 Create Staff-Assisted Order
export default function () {
  const s = new Sequence("SD-UC003", {
    title: "UC003",
    parts: [
      { id: "st", kind: "actor", name: "Staff" },
      { id: "ui", kind: "boundary", name: "POSOrderScreen" },
      { id: "ctl", kind: "control", name: "StaffOrderController" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "pr", kind: "entity", name: "Product" },
      { id: "ord", kind: "entity", name: "Order" },
      { id: "dc", kind: "entity", name: "DiscountCode" },
      { id: "aud", kind: "entity", name: "AuditLog" },
    ],
    gaps: [140, 160, 110, 100, 100, 100, 100],
  });
  s.call("st", "ui", "openPOS(source)");
  s.call("ui", "ctl", "getInStoreProducts()");
  s.callRet("ctl", "pr", "findInStore()", "products");
  s.ret("ctl", "ui", "products");
  s.ret("ui", "st", "product list");
  s.loop("for each line item", () => s.callRet("st", "ui", "addItem(product, options)", "items, subtotal"));
  s.opt("customer is a member", () => {
    s.call("st", "ui", "lookUpMember(phone)");
    s.call("ui", "ctl", "lookUpMember(phone)");
    s.ref("Look Up Member (UC024)\n(phone)", ["ctl"]);
    s.ret("ctl", "ui", "member or \"not found\"");
    s.ret("ui", "st", "member details or \"not found\"");
  });
  s.callRet("st", "ui", "enterRecipientAndCode(details)", "updated form");
  s.call("st", "ui", "confirmOrder()");
  s.call("ui", "ctl", "createOrder(orderRequest)");
  s.opt("member phone entered", () => s.callRet("ctl", "cus", "findActiveByPhone(phone)", "customer | null"));
  s.callRet("ctl", "pr", "findInStore(productIds)", "products");
  s.self("ctl", "checkItemsAndDelivery()");
  s.opt("discount code entered", () => {
    s.self("ctl", "requireMember()");
    s.ref("Validate Discount Code (UC023)\n(code, customer, subtotal)", ["ctl"]);
  });
  s.self("ctl", "calculateTotal()");
  s.alt(
    ["a check failed", () => {
      s.ret("ctl", "ui", "error: reason", { end: false });
      s.ret("ui", "st", "show reason", { end: false });
    }],
    ["order valid", () => {
      s.callRet("ctl", "ord", "create(branch, source, staff, items)", "order");
      s.callRet("ctl", "ord", "addStatusHistory(created)", "history");
      s.opt("discount applied", () => s.callRet("ctl", "dc", "recordUsage(customer, order)", "usage"));
      s.callRet("ctl", "aud", "record(orderCreated)", "entry");
      s.ret("ctl", "ui", "order, discount, total");
      s.ret("ui", "st", "created order, discount, total");
    }],
  );
  return s.finish();
}
