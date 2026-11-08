import { Sequence } from "./seq.mjs";

// SD-UC024 Look Up Member (referenced from SD-UC003)
export default function () {
  const s = new Sequence("SD-UC024", {
    title: "UC024",
    parts: [
      { id: "ctl", kind: "control", name: "MemberLookupController" },
      { id: "cus", kind: "entity", name: "Customer" },
    ],
    gaps: [190],
    left: 200, gate: 170,
  });
  s.gateCall("ctl", "lookUp(phone)");
  s.callRet("ctl", "cus", "findActiveByPhone(phone)", "customer | null");
  s.alt(
    ["active member found", () => s.gateRet("ctl", "name, rank, points", { end: false })],
    ["no active member", () => s.gateRet("ctl", "error: member not found")],
  );
  return s.finish();
}
