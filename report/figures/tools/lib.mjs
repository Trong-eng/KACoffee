// Helpers that generate draw.io (mxGraph XML) files with explicit geometry,
// so that node overlaps and edge crossings can be checked before export.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DRAWIO = path.join(process.env.LOCALAPPDATA || "", "Programs", "draw.io", "draw.io.exe");
export const FIG_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Labels are rendered as HTML (html=1): "\n" becomes a line break.
const html = (s) => esc(String(s).split("\n").join("<br>"));

export class Diagram {
  constructor(name) {
    this.name = name;
    this.cells = [];   // raw xml cells
    this.nodes = {};   // id -> {x,y,w,h,kind}
    this.edges = [];   // {id, pts:[[x,y]...], label, labelBox}
    this.n = 2;
  }
  id() { return `c${this.n++}`; }

  // ---------- vertices ----------
  vertex(id, label, x, y, w, h, style, kind = "node", check = true) {
    this.cells.push(
      `<mxCell id="${id}" value="${html(label)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
    if (check) this.nodes[id] = { x, y, w, h, kind, label, ellipse: /^(ellipse|rhombus)/.test(style) };
    return id;
  }

  // ---------- edges with explicit polyline ----------
  // pts: absolute points from source port to target port (inclusive).
  edge(src, dst, pts, opts = {}) {
    const id = opts.id || this.id();
    const [x1, y1] = pts[0];
    const [x2, y2] = pts[pts.length - 1];
    // n.g keeps the real geometry when the check box was enlarged (e.g. actor labels)
    const s = this.nodes[src].g || this.nodes[src], d = this.nodes[dst].g || this.nodes[dst];
    const rel = (n, x, y) => [+((x - n.x) / n.w).toFixed(4), +((y - n.y) / n.h).toFixed(4)];
    const [ex, ey] = rel(s, x1, y1);
    const [nx, ny] = rel(d, x2, y2);
    const style = [
      "html=1", "rounded=0", "edgeStyle=none", "jumpStyle=arc",
      `endArrow=${opts.endArrow || "block"}`, `endFill=${opts.endFill ?? 1}`,
      opts.dashed ? "dashed=1" : "", opts.endSize ? `endSize=${opts.endSize}` : "endSize=8",
      `exitX=${ex}`, `exitY=${ey}`, "exitPerimeter=0", `entryX=${nx}`, `entryY=${ny}`, "entryPerimeter=0",
      "fontSize=11", "labelBackgroundColor=#ffffff", "fontFamily=Helvetica",
      opts.style || "",
    ].filter(Boolean).join(";");
    const mid = pts.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("");
    // label position: lx in [-1,1] along the edge, plus pixel offset (ox, oy)
    const lx = opts.lx ?? 0, ox = opts.ox ?? 0, oy = opts.oy ?? 0;
    this.cells.push(
      `<mxCell id="${id}" value="${html(opts.label || "")}" style="${style}" edge="1" parent="1" source="${src}" target="${dst}">` +
      `<mxGeometry x="${lx}" relative="1" as="geometry">` +
      (ox || oy ? `<mxPoint x="${ox}" y="${oy}" as="offset"/>` : "") +
      `<mxPoint x="${x1}" y="${y1}" as="sourcePoint"/><mxPoint x="${x2}" y="${y2}" as="targetPoint"/>` +
      (mid ? `<Array as="points">${mid}</Array>` : "") +
      `</mxGeometry></mxCell>`);
    let labelBox = null;
    if (opts.label) {
      const [px, py] = pointAlong(pts, (lx + 1) / 2);
      const lines = String(opts.label).split("\n");
      const w = Math.max(...lines.map((l) => l.length)) * 6.2 + 4, h = 14 * lines.length;
      labelBox = { x: px + ox - w / 2, y: py + oy - h / 2, w, h, label: opts.label };
    }
    this.edges.push({ id, src, dst, pts, label: opts.label, labelBox, kind: opts.kind || "flow" });
    return id;
  }

  // ---------- output ----------
  xml() {
    return `<mxfile host="drawio"><diagram id="${esc(this.name)}" name="${esc(this.name)}">` +
      `<mxGraphModel dx="1200" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0"><root>` +
      `<mxCell id="0"/><mxCell id="1" parent="0"/>` + this.cells.join("") +
      `</root></mxGraphModel></diagram></mxfile>`;
  }

  save({ exportPdf = true, exportPng = true } = {}) {
    const src = path.join(FIG_DIR, "src", `${this.name}.drawio`);
    fs.mkdirSync(path.dirname(src), { recursive: true });
    fs.writeFileSync(src, this.xml());
    const png = path.join(FIG_DIR, "png", `${this.name}.png`);
    fs.mkdirSync(path.dirname(png), { recursive: true });
    if (exportPdf) execFileSync(DRAWIO, ["-x", "-f", "pdf", "--crop", "-o", path.join(FIG_DIR, `${this.name}.pdf`), src]);
    if (exportPng) execFileSync(DRAWIO, ["-x", "-f", "png", "-s", "2", "-b", "10", "-o", png, src]);
    return this.check();
  }

  // ---------- quality checks ----------
  check() {
    const issues = [...(this.laneIssues || [])];
    const nodes =Object.entries(this.nodes).filter(([, n]) => n.kind !== "container");
    // 1. node-node overlaps
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (boxOverlap(nodes[i][1], nodes[j][1], 2)) issues.push(`node overlap: ${nodes[i][0]} / ${nodes[j][0]}`);
    // 2. edge passes through a node other than its endpoints
    for (const e of this.edges)
      for (const [nid, n] of nodes) {
        if (nid === e.src || nid === e.dst) continue;
        for (let k = 0; k < e.pts.length - 1; k++)
          if (segHitsBox(e.pts[k], e.pts[k + 1], n, 1)) { issues.push(`edge ${e.src}->${e.dst} passes through ${nid}`); break; }
      }
    // 3. labels overlapping nodes or other labels
    const labels = this.edges.filter((e) => e.labelBox);
    for (const e of labels) {
      for (const [nid, n] of nodes) if (boxOverlap(e.labelBox, n, 0)) issues.push(`label "${e.label}" overlaps node ${nid}`);
      for (const f of labels) if (f !== e && f.id > e.id && boxOverlap(e.labelBox, f.labelBox, 0)) issues.push(`label "${e.label}" overlaps label "${f.label}"`);
      for (const sx of this.separators || []) if (e.labelBox.x < sx && e.labelBox.x + e.labelBox.w > sx) issues.push(`label "${e.label}" sits on a lane separator`);
      for (const g of this.edges) if (g !== e) for (let k = 0; k < g.pts.length - 1; k++)
        if (segHitsBox(g.pts[k], g.pts[k + 1], e.labelBox, 0)) { issues.push(`label "${e.label}" is crossed by edge ${g.src}->${g.dst}`); break; }
    }
    // 4. edge crossings (proper intersections between segments of different edges)
    let crossings = 0;
    for (let i = 0; i < this.edges.length; i++)
      for (let j = i + 1; j < this.edges.length; j++) {
        const a = this.edges[i], b = this.edges[j];
        for (let p = 0; p < a.pts.length - 1; p++)
          for (let q = 0; q < b.pts.length - 1; q++)
            if (segCross(a.pts[p], a.pts[p + 1], b.pts[q], b.pts[q + 1])) crossings++;
      }
    return { name: this.name, nodes: nodes.length, edges: this.edges.length, crossings, issues };
  }
}

export function pointAlong(pts, t) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l); total += l;
  }
  let d = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const r = segs[i] ? d / segs[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    d -= segs[i];
  }
  return pts[0];
}

function boxOverlap(a, b, m) {
  return a.x < b.x + b.w - m && b.x < a.x + a.w - m && a.y < b.y + b.h - m && b.y < a.y + a.h - m;
}
function segHitsBox(p, q, b, m) {
  // sample the segment; enough for orthogonal and short straight segments
  const n = 40;
  for (let i = 1; i < n; i++) {
    const x = p[0] + ((q[0] - p[0]) * i) / n, y = p[1] + ((q[1] - p[1]) * i) / n;
    if (b.ellipse) {
      // ellipse (and, conservatively, rhombus) interior test
      const ex = (x - (b.x + b.w / 2)) / (b.w / 2 - m), ey = (y - (b.y + b.h / 2)) / (b.h / 2 - m);
      if (ex * ex + ey * ey < 1) return true;
    } else if (x > b.x + m && x < b.x + b.w - m && y > b.y + m && y < b.y + b.h - m) return true;
  }
  return false;
}
function orient(a, b, c) { return Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])); }
function same(a, b) { return Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5; }
function segCross(a, b, c, d) {
  if (same(a, c) || same(a, d) || same(b, c) || same(b, d)) return false; // shared endpoint (merge)
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

// ===================================================================
// Swimlane activity diagram builder (template style: rounded frame,
// title, <<precondition>>/<<postcondition>> notes, vertical lanes).
// ===================================================================
export const ST = {
  frame: "rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;verticalAlign=top;fontSize=16;spacingTop=8;fontFamily=Helvetica;",
  lane: "swimlane;html=1;startSize=34;horizontal=1;fillColor=#ffffff;swimlaneFillColor=#ffffff;fontStyle=0;fontSize=13;fontFamily=Helvetica;collapsible=0;",
  note: "text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=12;fontFamily=Helvetica;",
  action: "rounded=1;arcSize=25;whiteSpace=wrap;html=1;fontSize=12;fontFamily=Helvetica;fillColor=#ffffff;",
  initial: "ellipse;html=1;fillColor=#000000;strokeColor=#000000;",
  final: "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;",
  decision: "rhombus;html=1;fillColor=#ffffff;",
};

export class Activity extends Diagram {
  // lanes: ["Guest", "KACoffee System"], opts: {title, pre, post, laneW, rowH}
  constructor(name, { title, pre, post, lanes, laneW = 280, rowH = 72, laneWs }) {
    super(name);
    this.title = title; this.pre = pre; this.post = post;
    this.lanes = lanes;
    this.laneWs = laneWs || lanes.map(() => laneW);
    this.rowH = rowH;
    this.fx = 0; this.fy = 0;           // frame origin
    this.px = 40;                       // pool left
    const poolW0 = this.laneWs.reduce((a, b) => a + b, 0);
    const lines = (s) => (s ? Math.ceil(((s.length + 22) * 6.9) / poolW0) : 0);
    this.preLines = lines(pre); this.postLines = lines(post);
    this.noteH = 18 * (this.preLines + this.postLines) + 10;
    this.py = 52 + this.noteH;          // pool top
    this.rowTop = this.py + 34 + 30;    // first row centre
    this.laneX = [];
    let x = this.px;
    for (const w of this.laneWs) { this.laneX.push(x); x += w; }
    this.poolW = x - this.px;
  }
  cx(lane, dx = 0) { return this.laneX[lane] + this.laneWs[lane] / 2 + dx; }
  cy(row) { return this.rowTop + row * this.rowH; }

  // add nodes; pos = {lane, row, dx, dy}
  action(id, label, lane, row, { w = 170, h = 44, dx = 0, dy = 0 } = {}) {
    const x = this.cx(lane, dx) - w / 2, y = this.cy(row) + dy - h / 2;
    return this.vertex(id, label, x, y, w, h, ST.action);
  }
  start(id, lane, row, { dx = 0 } = {}) {
    return this.vertex(id, "", this.cx(lane, dx) - 13, this.cy(row) - 13, 26, 26, ST.initial);
  }
  end(id, lane, row, { dx = 0, dy = 0 } = {}) {
    return this.vertex(id, "", this.cx(lane, dx) - 15, this.cy(row) + dy - 15, 30, 30, ST.final);
  }
  // UML comment (dog-eared note); attach it with an "anchor" edge
  comment(id, text, lane, row, { w = 190, h = 54, dx = 0, dy = 0 } = {}) {
    const x = this.cx(lane, dx) - w / 2, y = this.cy(row) + dy - h / 2;
    return this.vertex(id, text, x, y, w, h, "shape=note;size=12;whiteSpace=wrap;html=1;align=left;spacingLeft=6;fontSize=11;fontFamily=Helvetica;fillColor=#ffffff;");
  }
  decision(id, lane, row, { dx = 0, dy = 0, label = "" } = {}) {
    return this.vertex(id, label, this.cx(lane, dx) - 20, this.cy(row) + dy - 20, 40, 40, ST.decision);
  }

  port(id, side) {
    const n = this.nodes[id];
    return { t: [n.x + n.w / 2, n.y], b: [n.x + n.w / 2, n.y + n.h], l: [n.x, n.y + n.h / 2], r: [n.x + n.w, n.y + n.h / 2] }[side];
  }
  // Orthogonal flow from side fs of a to side ts of b; via = extra points (abs).
  flow(a, b, fs = "b", ts = "t", opts = {}) {
    const p1 = this.port(a, fs), p2 = this.port(b, ts);
    let pts;
    if (opts.via) pts = [p1, ...opts.via, p2];
    else if ("tb".includes(fs) && "tb".includes(ts)) {
      if (Math.abs(p1[0] - p2[0]) < 0.5) pts = [p1, p2];
      else { const my = opts.my ?? (p1[1] + p2[1]) / 2; pts = [p1, [p1[0], my], [p2[0], my], p2]; }
    } else if ("lr".includes(fs) && "lr".includes(ts)) {
      if (Math.abs(p1[1] - p2[1]) < 0.5) pts = [p1, p2];
      else { const mx = opts.mx ?? (p1[0] + p2[0]) / 2; pts = [p1, [mx, p1[1]], [mx, p2[1]], p2]; }
    } else if ("tb".includes(fs)) pts = [p1, [p1[0], p2[1]], p2];
    else pts = [p1, [p2[0], p1[1]], p2];
    return this.edge(a, b, pts, opts);
  }
  // Loop back: leave side fs of a, run along gutter x, enter side ts of b.
  loop(a, b, gx, fs = "l", ts = "l", opts = {}) {
    const p1 = this.port(a, fs), p2 = this.port(b, ts);
    return this.edge(a, b, [p1, [gx, p1[1]], [gx, p2[1]], p2], opts);
  }

  finish(rows) {
    // frame, title, notes and lanes are drawn first (behind the nodes)
    const poolH = 34 + 30 + (rows - 1) * this.rowH + 46;
    const frameW = this.poolW + 2 * this.px, frameH = this.py + poolH + 30;
    const back = [];
    const push = (id, label, x, y, w, h, style) => back.push(
      `<mxCell id="${id}" value="${esc(label)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
    push("frame", this.title, 0, 0, frameW, frameH, ST.frame);
    let noteY = 44;
    if (this.pre) { push("pre", `&lt;&lt;precondition&gt;&gt; ${this.pre}`, this.px, noteY, this.poolW, 18 * this.preLines, ST.note); noteY += 18 * this.preLines; }
    if (this.post) push("post", `&lt;&lt;postcondition&gt;&gt; ${this.post}`, this.px, noteY, this.poolW, 18 * this.postLines, ST.note);
    // lane separators are obstacles for edge labels
    this.separators = this.laneX.slice(1);
    this.lanes.forEach((name, i) => push(`lane${i}`, name, this.laneX[i], this.py, this.laneWs[i], poolH, ST.lane));
        this.cells = back.concat(this.cells);
    // nodes must stay inside one lane of the pool
    const bounds = [this.px, ...this.separators, this.px + this.poolW];
    for (const [id, n] of Object.entries(this.nodes)) {
      if (n.y + n.h > this.py + poolH - 6) throw new Error(`${this.name}: node ${id} below pool`);
      for (const bx of bounds) if (n.x - 6 < bx && n.x + n.w + 6 > bx) this.laneIssues = [...(this.laneIssues || []), `node ${id} crosses a lane border`];
    }
    return this;
  }
}
