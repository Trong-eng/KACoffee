import { Sequence } from "./seq.mjs";

// SD-UC005 Update Delivery Status
export default function () {
  const s = new Sequence("SD-UC005", {
    title: "UC005",
    parts: [
      { id: "sh", kind: "actor", name: "Shipper" },
      { id: "ui", kind: "boundary", name: "ShipperDeliveryScreen" },
      { id: "ctl", kind: "control", name: "DeliveryStatusController" },
      { id: "del", kind: "entity", name: "Delivery" },
      { id: "ord", kind: "entity", name: "Order" },
      { id: "ntf", kind: "entity", name: "Notification" },
    ],
    gaps: [150, 170, 150, 100, 100],
  });
  s.call("sh", "ui", "openDeliveries()");
  s.call("ui", "ctl", "listAssigned()");
  s.callRet("ctl", "del", "findByShipper(shipperId)", "deliveries");
  s.ret("ctl", "ui", "deliveries");
  s.ret("ui", "sh", "assigned deliveries");
  s.loop("until the delivery is delivered or failed", () => {
    s.call("sh", "ui", "act(delivery, action)");
    s.call("ui", "ctl", "updateDelivery(id, action)");
    s.callRet("ctl", "del", "find(deliveryId)", "delivery");
    s.alt(
      ["not assigned to this shipper or action not allowed", () => {
        s.ret("ctl", "ui", "error: reason", { end: false });
        s.ret("ui", "sh", "show error", { end: false });
      }],
      ["action allowed", () => {
        s.alt(
          ["pickup or start", () => s.callRet("ctl", "del", "setStatus(next)", "updated")],
          ["delivered", () => {
            s.callRet("ctl", "del", "setStatus(delivered)", "updated");
            s.callRet("ctl", "ord", "complete()", "completed, paid");
            s.ref("Award Loyalty Points (UC025)", ["ctl"]);
          }],
          ["failed, reason entered", () => {
            s.callRet("ctl", "del", "setFailed(reason)", "updated");
            s.opt("order has a member", () => s.callRet("ctl", "ntf", "createDeliveryFailed(order)", "notification"));
          }],
        );
        s.callRet("ctl", "del", "addStatusHistory(change)", "history");
        s.ret("ctl", "ui", "updated delivery");
        s.ret("ui", "sh", "updated delivery");
      }],
    );
  });
  return s.finish();
}
