import { Sequence } from "./seq.mjs";

// SD-UC004 Manage Discount Codes
export default function () {
  const s = new Sequence("SD-UC004", {
    title: "UC004",
    parts: [
      { id: "a", kind: "actor", name: "Admin" },
      { id: "ui", kind: "boundary", name: "DiscountCodePage" },
      { id: "ctl", kind: "control", name: "DiscountCodeController" },
      { id: "rank", kind: "entity", name: "MembershipRank" },
      { id: "dc", kind: "entity", name: "DiscountCode" },
    ],
    gaps: [140, 170, 140, 120],
  });
  s.call("a", "ui", "openDiscountCodes()");
  s.call("ui", "ctl", "loadPage()");
  s.callRet("ctl", "dc", "findAll()", "codes");
  s.callRet("ctl", "rank", "findAll()", "ranks");
  s.ret("ctl", "ui", "codes, ranks");
  s.ret("ui", "a", "code list, creation form");
  s.call("a", "ui", "submit(codeData)");
  s.call("ui", "ctl", "createCode(codeData)");
  s.self("ctl", "normaliseAndValidate()");
  s.alt(
    ["values invalid", () => {
      s.ret("ctl", "ui", "validation errors", { end: false });
      s.ret("ui", "a", "show messages", { end: false });
    }],
    ["values valid", () => {
      s.callRet("ctl", "dc", "findByCode(code)", "code | null");
      s.alt(
        ["code already exists", () => {
          s.ret("ctl", "ui", "error: code exists", { end: false });
          s.ret("ui", "a", "show error", { end: false });
        }],
        ["code is new", () => {
          s.callRet("ctl", "dc", "create(codeData, active)", "code");
          s.opt("ranks selected", () => s.callRet("ctl", "dc", "addEligibleRanks(ranks)", "links"));
          s.ret("ctl", "ui", "created code");
          s.self("ui", "refreshListAndResetForm()");
          s.ret("ui", "a", "success message");
        }],
      );
    }],
  );
  return s.finish();
}
