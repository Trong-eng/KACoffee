import { Diagram } from "./lib.mjs";

// General use case diagram. Positions are given explicitly (centre points)
// and tuned so that no object overlaps and lines cross as little as possible.
const UC_W = 216, UC_H = 60;
const S = {
  boundary: "rounded=0;whiteSpace=wrap;html=1;fillColor=none;verticalAlign=top;align=center;fontSize=16;fontStyle=1;spacingTop=6;fontFamily=Helvetica;",
  uc: "ellipse;whiteSpace=wrap;html=1;fontSize=12;fontFamily=Helvetica;fillColor=#ffffff;",
  ucExt: "ellipse;whiteSpace=wrap;html=1;fontSize=12;fontFamily=Helvetica;fillColor=#ffffff;dashed=0;",
  actor: "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=13;fontFamily=Helvetica;",
  actorAbs: "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=13;fontStyle=2;fontFamily=Helvetica;",
};

export default function () {
  const d = new Diagram("general_use_case");
  const BX = 230, BY = 20, BW = 900, BH = 1130;      // system boundary
  const colA = 432, colM = 690, colD = 960;          // ellipse columns (centre x)
  const AL = 110, AR = 1240;                         // actor columns (centre x)

  d.vertex("boundary", "KACoffee System", BX, BY, BW, BH, S.boundary, "container", false);

  const ucs = {};
  const uc = (id, label, cx, cy, style = S.uc) => {
    ucs[id] = { cx, cy };
    return d.vertex(id, label, cx - UC_W / 2, cy - UC_H / 2, UC_W, UC_H, style);
  };
  const actor = (id, label, cx, cy, abs = false) => {
    d.vertex(id, label, cx - 15, cy - 30, 30, 60, abs ? S.actorAbs : S.actor);
    // reserve room for the label under the figure in the overlap check
    const n = d.nodes[id]; n.g = { x: n.x, y: n.y, w: n.w, h: n.h }; const lw = Math.max(30, label.length * 7.5);
    n.x = cx - lw / 2; n.w = lw; n.h += 20;
    n.fig = { cx, cy };
  };

  // ---------------- use cases ----------------
  // Guest / Customer side (left column)
  uc("UC001", "UC001: Register as Customer", colA, 60);
  uc("UC011", "UC011: Browse Menu and Public Content", colA, 160);
  uc("UC012", "UC012: Manage Cart", colA, 240);
  uc("UC002", "UC002: Place Online Order", colA, 330);
  uc("UC013", "UC013: Manage Profile", colA, 410);
  uc("UC014", "UC014: View Orders and Order Tracking", colA, 490);
  uc("UC015", "UC015: Cancel Own Order", colA, 570);
  uc("UC016", "UC016: View Membership, Points and Notifications", colA, 650);
  // shared / extension use cases (middle column)
  uc("VDC", "UC023: Validate Discount Code", colM, 470);
  uc("LUM", "UC024: Look Up Member", colM, 730);
  uc("ALP", "UC025: Award Loyalty Points", colM, 860);
  uc("UC006", "UC006: Log In", colM + 45, 1000);
  uc("UC007", "UC007: Log Out", colM - 120, 1085);
  // Admin / Manager / Staff / Shipper side (right column)
  uc("UC004", "UC004: Manage Discount Codes", colD, 75);
  uc("UC017", "UC017: Manage Products and Categories", colD, 145);
  uc("UC018", "UC018: Manage Branches", colD, 215);
  uc("UC021", "UC021: Configure Targets and System Settings", colD, 285);
  uc("UC022", "UC022: View Bottle Exchange History", colD, 355);
  uc("UC009", "UC009: Assign Delivery", colD, 445);
  uc("UC019", "UC019: Manage Employees", colD, 515);
  uc("UC020", "UC020: View Reports and Audit Logs", colD, 585);
  uc("UC003", "UC003: Create Staff-Assisted Order", colD, 675);
  uc("UC008", "UC008: Update Store Order Status", colD, 815);
  uc("UC010", "UC010: Process Bottle Exchange", colD, 745);
  uc("UC005", "UC005: Update Delivery Status", colD, 925);

  // ---------------- actors ----------------
  actor("Guest", "Guest", AL, 110);
  actor("Customer", "Customer", AL, 430);
  actor("Admin", "Admin", AR, 215);
  actor("Manager", "Manager", AR, 515);
  actor("Staff", "Staff", AR, 745);
  actor("Shipper", "Shipper", AR, 925);
  actor("Employee", "Employee", AR, 1060, true);

  // ---------------- relationships ----------------
  const ellipsePt = (id, tx, ty) => {
    const { cx, cy } = ucs[id]; const a = UC_W / 2, b = UC_H / 2;
    const dx = tx - cx, dy = ty - cy; const k = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b));
    return [+(cx + dx * k).toFixed(1), +(cy + dy * k).toFixed(1)];
  };
  const actorPt = (id, side) => {
    const { cx, cy } = d.nodes[id].fig;
    return { r: [cx + 15, cy], l: [cx - 15, cy], t: [cx, cy - 30], b: [cx, cy + 30] }[side];
  };
  const assoc = (a, u) => {
    const side = d.nodes[a].fig.cx < BX ? "r" : "l";
    const p = actorPt(a, side);
    // attach to the middle of the ellipse side that faces the actor
    const q = [ucs[u].cx + (side === "r" ? -UC_W / 2 : UC_W / 2), ucs[u].cy];
    d.edge(a, u, [p, q], { endArrow: "none", kind: "assoc" });
  };
  const rel = (from, to, label, lx = 0) => { // <<extend>>: dashed open arrow from extension to base
    const { cx, cy } = ucs[to]; const p = ellipsePt(from, cx, cy); const q = ellipsePt(to, ucs[from].cx, ucs[from].cy);
    d.edge(from, to, [p, q], { dashed: true, endArrow: "open", endFill: 0, label, lx, kind: "extend" });
  };
  // generalisation: hollow triangle to the parent, routed through a gutter
  // right of the actor column so it never crosses figures or labels
  const gen = (child, parent, gx) => {
    const c = d.nodes[child].fig, p = d.nodes[parent].fig;
    const pts = [[c.cx + 15, c.cy + 8], [gx, c.cy + 8], [gx, p.cy - 8], [p.cx + 15, p.cy - 8]];
    d.edge(child, parent, pts, { endArrow: "block", endFill: 0, endSize: 14, kind: "gen" });
  };

  ["UC001", "UC011", "UC012"].forEach((u) => assoc("Guest", u));
  ["UC011", "UC012", "UC002", "UC013", "UC014", "UC015", "UC016", "UC006", "UC007"].forEach((u) => assoc("Customer", u));
  ["UC004", "UC017", "UC018", "UC021", "UC022"].forEach((u) => assoc("Admin", u));
  ["UC009", "UC019", "UC020"].forEach((u) => assoc("Manager", u));
  ["UC003", "UC008", "UC010"].forEach((u) => assoc("Staff", u));
  assoc("Shipper", "UC005");
  ["UC006", "UC007"].forEach((u) => assoc("Employee", u));

  gen("Admin", "Manager", AR + 45);
  gen("Manager", "Staff", AR + 65);
  gen("Staff", "Employee", AR + 85);
  gen("Shipper", "Employee", AR + 45);

  rel("VDC", "UC002", "«extend»", -0.35);
  rel("VDC", "UC003", "«extend»");
  rel("LUM", "UC003", "«extend»");
  rel("ALP", "UC008", "«extend»");
  rel("ALP", "UC005", "«extend»");
  return d;
}
