import { Sequence } from "./seq.mjs";

// SD-UC002 Place Online Order
export default function () {
  const s = new Sequence("SD-UC002", {
    title: "UC002",
    parts: [
      { id: "c", kind: "actor", name: "Customer" },
      { id: "ui", kind: "boundary", name: "CheckoutPage" },
      { id: "ctl", kind: "control", name: "PlaceOrderController" },
      { id: "br", kind: "entity", name: "Branch" },
      { id: "pr", kind: "entity", name: "Product" },
      { id: "ord", kind: "entity", name: "Order" },
      { id: "dc", kind: "entity", name: "DiscountCode" },
      { id: "aud", kind: "entity", name: "AuditLog" },
    ],
    gaps: [140, 160, 120, 100, 100, 100, 100],
  });
  s.call("c", "ui", "selectCheckout()");
  s.call("ui", "ctl", "getCheckoutOptions()");
  s.callRet("ctl", "br", "findActive()", "active branches");
  s.ret("ctl", "ui", "branches, delivery fee");
  s.ret("ui", "c", "checkout form, summary");
  s.callRet("c", "ui", "fillCheckoutForm(details)", "updated summary");
  s.opt("discount code entered", () => {
    s.call("c", "ui", "previewDiscount(code)");
    s.call("ui", "ctl", "previewDiscount(code, subtotal)");
    s.ref("Validate Discount Code (UC023)\n(code, customer, subtotal)", ["ctl"]);
    s.ret("ctl", "ui", "discount or reason");
    s.ret("ui", "c", "updated summary or reason");
  });
  s.call("c", "ui", "confirmOrder()");
  s.call("ui", "ctl", "placeOrder(orderRequest)");
  s.callRet("ctl", "br", "find(branchId)", "branch | null");
  s.callRet("ctl", "pr", "findOnline(productIds)", "products");
  s.self("ctl", "checkItems()");
  s.self("ctl", "calculatePrices()");
  s.opt("discount code kept", () => s.ref("Validate Discount Code (UC023)\n(code, customer, subtotal)", ["ctl"]));
  s.self("ctl", "checkCityAndAddFee()");
  s.alt(
    ["a check failed", () => {
      s.ret("ctl", "ui", "error: reason", { end: false });
      s.ret("ui", "c", "show reason", { end: false });
    }],
    ["order valid", () => {
      s.callRet("ctl", "ord", "create(items, preparing, unpaid)", "order");
      s.callRet("ctl", "ord", "addStatusHistory(created)", "history");
      s.opt("discount applied", () => s.callRet("ctl", "dc", "recordUsage(customer, order)", "usage"));
      s.callRet("ctl", "aud", "record(orderCreated)", "entry");
      s.ret("ctl", "ui", "order");
      s.self("ui", "clearCart()");
      s.ret("ui", "c", "order details, order number");
    }],
  );
  return s.finish();
}
