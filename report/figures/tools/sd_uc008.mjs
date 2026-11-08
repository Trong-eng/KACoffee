import { Sequence } from "./seq.mjs";

// SD-UC008 Update Store Order Status
export default function () {
  const s = new Sequence("SD-UC008", {
    title: "UC008",
    parts: [
      { id: "st", kind: "actor", name: "Staff" },
      { id: "ui", kind: "boundary", name: "OrderStatusScreen" },
      { id: "ctl", kind: "control", name: "OrderStatusController" },
      { id: "ord", kind: "entity", name: "Order" },
      { id: "ntf", kind: "entity", name: "Notification" },
      { id: "del", kind: "entity", name: "Delivery" },
      { id: "aud", kind: "entity", name: "AuditLog" },
    ],
    gaps: [140, 160, 120, 100, 100, 90],
  });
  s.call("st", "ui", "openOrderStatus()");
  s.call("ui", "ctl", "listOrders()");
  s.callRet("ctl", "ord", "findByBranch(branchId)", "orders");
  s.ret("ctl", "ui", "orders");
  s.ret("ui", "st", "orders with status");
  s.call("st", "ui", "changeStatus(order, newStatus)");
  s.call("ui", "ctl", "updateStatus(orderId, newStatus)");
  s.callRet("ctl", "ord", "find(orderId)", "order");
  s.alt(
    ["order of another branch", () => {
      s.ret("ctl", "ui", "error: access denied", { end: false });
      s.ret("ui", "st", "show error", { end: false });
    }],
    ["transition not allowed", () => {
      s.ret("ctl", "ui", "error: invalid transition", { end: false });
      s.ret("ui", "st", "show error", { end: false });
    }],
    ["transition allowed", () => {
      s.alt(
        ["newStatus = ready", () => {
          s.callRet("ctl", "ord", "setStatus(ready)", "updated");
          s.opt("order has a member", () => s.callRet("ctl", "ntf", "createOrderReady(order)", "notification"));
          s.opt("delivery order", () => {
            s.callRet("ctl", "del", "create(order, pending)", "delivery");
            s.callRet("ctl", "aud", "record(deliveryCreated)", "entry");
          });
        }],
        ["newStatus = completed (pickup)", () => {
          s.callRet("ctl", "ord", "complete()", "completed, paid");
          s.ref("Award Loyalty Points (UC025)\n(order)", ["ctl"]);
        }],
        ["newStatus = cancelled", () => s.callRet("ctl", "ord", "cancel()", "cancelled")],
      );
      s.callRet("ctl", "ord", "addStatusHistory(change)", "history");
      s.callRet("ctl", "aud", "record(statusChange)", "entry");
      s.ret("ctl", "ui", "updated order");
      s.ret("ui", "st", "updated order");
    }],
  );
  return s.finish();
}
