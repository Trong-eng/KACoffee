import { Sequence } from "./seq.mjs";

// SD-UC009 Assign Delivery
export default function () {
  const s = new Sequence("SD-UC009", {
    title: "UC009",
    parts: [
      { id: "m", kind: "actor", name: "Manager" },
      { id: "ui", kind: "boundary", name: "DeliveryBoard" },
      { id: "ctl", kind: "control", name: "AssignDeliveryController" },
      { id: "del", kind: "entity", name: "Delivery" },
      { id: "emp", kind: "entity", name: "Employee" },
      { id: "aud", kind: "entity", name: "AuditLog" },
    ],
    gaps: [140, 170, 140, 100, 100],
  });
  s.call("m", "ui", "openDeliveries()");
  s.call("ui", "ctl", "listDeliveries()");
  s.callRet("ctl", "del", "findInScope(branchId)", "deliveries");
  s.ret("ctl", "ui", "deliveries");
  s.ret("ui", "m", "deliveries, status, shipper");
  s.call("m", "ui", "assign(delivery, shipper)");
  s.call("ui", "ctl", "assignShipper(deliveryId, shipperId)");
  s.callRet("ctl", "del", "find(deliveryId)", "delivery, order");
  s.alt(
    ["other branch or order not a ready delivery", () => {
      s.ret("ctl", "ui", "error: reason", { end: false });
      s.ret("ui", "m", "show error", { end: false });
    }],
    ["delivery can be assigned", () => {
      s.callRet("ctl", "emp", "find(shipperId)", "employee");
      s.alt(
        ["not an active shipper of the branch", () => {
          s.ret("ctl", "ui", "error: invalid shipper", { end: false });
          s.ret("ui", "m", "choose another shipper", { end: false });
        }],
        ["shipper valid", () => {
          s.callRet("ctl", "del", "assign(shipper)", "assigned");
          s.callRet("ctl", "del", "addStatusHistory(assigned)", "history");
          s.callRet("ctl", "aud", "record(assignment)", "entry");
          s.ret("ctl", "ui", "updated delivery");
          s.ret("ui", "m", "updated delivery");
        }],
      );
    }],
  );
  return s.finish();
}
