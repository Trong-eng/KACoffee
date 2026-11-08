import { Sequence } from "./seq.mjs";

// SD-UC003 Create Staff-Assisted Order
export default function () {
  const s = new Sequence("SD-UC003", {
    title: "UC003",
    parts: [
      { id: "st", kind: "actor", name: "Staff" },
      { id: "ui", kind: "boundary", name: "POSOrderScreen" },
      { id: "ctl", kind: "control", name: "StaffOrderController" },
      { id: "pr", kind: "entity", name: "Product" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "ord", kind: "entity", name: "Order" },
    ],
    gaps: [140, 160, 140, 110, 110],
  });
  s.call("st", "ui", "openPOS(source)");
  s.call("ui", "ctl", "getInStoreProducts()");
  s.callRet("ctl", "pr", "findInStore()", "products");
  s.ret("ctl", "ui", "products");
  s.ret("ui", "st", "product list");
  s.loop("for each line item", () => s.callRet("st", "ui", "addItem(product, options)", "items, subtotal"));
  s.opt("customer is a member", () => {
    s.call("st", "ui", "lookUpMember(phone)");
    s.ref("Look Up Member (UC024)", ["ui"]);
    s.ret("ui", "st", "member details or \"not found\"");
  });
  s.callRet("st", "ui", "enterRecipientAndCode(details)", "updated form");
  s.call("st", "ui", "confirmOrder()");
  s.call("ui", "ctl", "createOrder(orderRequest)");
  s.callRet("ctl", "pr", "findInStore(productIds)", "products");
  s.opt("member phone entered", () => s.callRet("ctl", "cus", "findActiveByPhone(phone)", "customer | null"));
  s.self("ctl", "checkItemsAndDelivery()");
  s.opt("discount code entered", () => s.ref("Validate Discount Code (UC023)", ["ctl"]));
  s.self("ctl", "calculateTotal()");
  s.alt(
    ["a check failed", () => {
      s.ret("ctl", "ui", "error: reason", { end: false });
      s.ret("ui", "st", "show reason", { end: false });
    }],
    ["order valid", () => {
      s.callRet("ctl", "ord", "create(branch, source, staff, items)", "order");
      s.ret("ctl", "ui", "order, discount, total");
      s.ret("ui", "st", "created order");
    }],
  );
  return s.finish();
}
