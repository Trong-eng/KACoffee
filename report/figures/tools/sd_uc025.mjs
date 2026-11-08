import { Sequence } from "./seq.mjs";

// SD-UC025 Award Loyalty Points (referenced from SD-UC005 and SD-UC008)
export default function () {
  const s = new Sequence("SD-UC025", {
    title: "UC025",
    parts: [
      { id: "lc", kind: "control", name: "LoyaltyController" },
      { id: "led", kind: "entity", name: "PointLedger" },
      { id: "cus", kind: "entity", name: "Customer" },
      { id: "rank", kind: "entity", name: "MembershipRank" },
      { id: "ntf", kind: "entity", name: "Notification" },
      { id: "ord", kind: "entity", name: "Order" },
    ],
    gaps: [170, 120, 120, 110, 100],
    left: 190, gate: 160,
  });
  s.gateCall("lc", "awardPoints(order)");
  s.opt("order has a member and no points awarded yet", () => {
    s.self("lc", "points = floor(eligible / 1,000)");
    s.callRet("lc", "led", "create(customer, order, points)", "entry");
    s.callRet("lc", "cus", "addPoints(points)", "total points");
    s.callRet("lc", "rank", "findHighestFor(totalPoints)", "rank");
    s.opt("rank changed", () => {
      s.callRet("lc", "cus", "setRank(rank)", "updated");
      s.callRet("lc", "ntf", "createRankUp(customer)", "notification");
    });
    s.callRet("lc", "ord", "markPointsAwarded()", "updated");
  });
  s.gateRet("lc", "done");
  return s.finish();
}
