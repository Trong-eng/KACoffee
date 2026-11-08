import { Sequence } from "./seq.mjs";

// SD-UC023 Validate Discount Code (referenced from SD-UC002 and SD-UC003)
export default function () {
  const s = new Sequence("SD-UC023", {
    title: "UC023",
    parts: [
      { id: "v", kind: "control", name: "DiscountValidator" },
      { id: "dc", kind: "entity", name: "DiscountCode" },
    ],
    gaps: [190],
    left: 250, gate: 220,
  });
  s.gateCall("v", "validate(code, customer, subtotal)");
  s.callRet("v", "dc", "findByCode(code)", "code | null");
  s.alt(
    ["code missing, inactive or outside its dates", () => s.gateRet("v", "error: invalid code", { end: false })],
    ["code usable", () => {
      s.alt(
        ["subtotal below the minimum order value", () => s.gateRet("v", "error: minimum not met", { end: false })],
        ["minimum met", () => {
          s.callRet("v", "dc", "getEligibleRanks()", "ranks");
          s.alt(
            ["rank of the member not eligible", () => s.gateRet("v", "error: rank not eligible", { end: false })],
            ["no ranks set or rank eligible", () => {
              s.self("v", "computeDiscount(subtotal)");
              s.gateRet("v", "discount amount");
            }],
          );
        }],
      );
    }],
  );
  return s.finish();
}
