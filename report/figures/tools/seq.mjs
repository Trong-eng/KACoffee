// UML sequence diagram builder in the style of the course template
// (Example_Report.pdf): draw.io diagrams with boundary/control/entity icons,
// underlined instance names, unnumbered messages, an always-active actor and
// a frame tagged with the use case code. Lays out lifelines, activation bars,
// messages and combined fragments with explicit geometry, writes
// figures/src/<name>.drawio and exports figures/<name>.pdf and
// figures/png/<name>.png with draw.io desktop. Overlap checks use estimated
// Helvetica text widths, so the exported PNGs still need a visual review.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FIG_DIR } from "./lib.mjs";

const DRAWIO = path.join(process.env.LOCALAPPDATA || "", "Programs", "draw.io", "draw.io.exe");
const FONT = 11;          // text size (draw.io px), as in the activity diagrams
const LINE = 13;          // line height of a label
const BAR = 10;           // activation bar width
const NEST = 5;           // x offset of a nested activation bar

// Helvetica advance widths (per 1 px of font size), used for layout and checks.
const ADV = { i: .22, l: .22, j: .22, f: .28, t: .28, r: .33, " ": .28, ",": .28, ".": .28, ":": .28,
  ";": .28, "(": .33, ")": .33, "[": .28, "]": .28, "|": .26, "'": .19, "-": .33, m: .83, w: .72,
  M: .83, W: .94, I: .28, "/": .28, "<": .58, ">": .58, "=": .58, "+": .58, "“": .33, "”": .33, '"': .36 };
export function textW(s, size = FONT) {
  let w = 0;
  for (const ch of String(s)) {
    if (ch in ADV) w += ADV[ch];
    else if (/[A-Z]/.test(ch)) w += .68;
    else if (/[0-9]/.test(ch)) w += .56;
    else w += .53;
  }
  return w * size * 1.04;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r = (v) => Math.round(v * 100) / 100;

export class Sequence {
  static gapOverride = {};
  // parts: [{id, kind: actor|boundary|control|entity, name}], gaps: distances between lifelines
  constructor(name, { title, parts, gaps, left = 60, gate = 0, number = false }) {
    this.gate = gate;
    this.name = name;
    this.title = title;
    this.number = number;
    this.parts = {};
    this.order = parts.map((p) => p.id);
    gaps = Sequence.gapOverride[name] || (Array.isArray(gaps) ? gaps : parts.slice(1).map(() => gaps));
    this.gaps = gaps;
    this.labels = [];            // {from, to, w} for gap sizing
    let x = left;
    parts.forEach((p, i) => {
      if (i > 0) x += Array.isArray(gaps) ? gaps[i - 1] : gaps;
      this.parts[p.id] = { ...p, x, open: p.kind === "actor" ? [{ y0: null, c: x }] : [], bars: [] };
    });
    this.left = left;
    this.headTop = 34;
    this.lifeTop = this.headTop + 64;
    this.y = this.lifeTop + 14;
    this.n = 0;                  // message counter
    this.k = 0;                  // node id counter
    this.items = [];             // drawing commands (in z-order groups)
    this.texts = [];             // {id, kind, est:{x,y,w,h}, owner}
    this.arrows = [];            // {id, pts}
    this.frames = [];            // fragment frames
    this.fragStack = [];
    this.minX = Infinity; this.maxX = -Infinity;
  }

  // ---------- geometry helpers ----------
  P(id) { const p = this.parts[id]; if (!p) throw new Error(`${this.name}: unknown part ${id}`); return p; }
  level(id) { return this.P(id).open.length; }
  // x of the edge of the top open bar of a part, facing direction dir (+1 right, -1 left)
  edgeX(id, dir) {
    const p = this.P(id);
    const L = p.open.length;
    if (L === 0) return p.x;
    const c = p.x + (L - 1) * NEST;
    return c + dir * BAR / 2;
  }
  touch(x0, x1) {
    this.minX = Math.min(this.minX, x0, x1); this.maxX = Math.max(this.maxX, x0, x1);
    for (const f of this.fragStack) { f.x0 = Math.min(f.x0, x0, x1); f.x1 = Math.max(f.x1, x0, x1); }
  }
  text(kind, label, x, y, anchor, owner, opts = {}) {
    const id = `T${this.k++}`;
    const lines = String(label).split("\n");
    const w = Math.max(...lines.map((l) => textW(l, opts.size || FONT))) + 4, h = LINE * lines.length + 2;
    let bx;
    if (anchor === "south" || anchor === "north" || anchor === "center") bx = x - w / 2;
    else if (anchor === "west" || anchor === "south west" || anchor === "north west") bx = x;
    else bx = x - w;
    let by;
    if (anchor.startsWith("south")) by = y - h;
    else if (anchor.startsWith("north")) by = y;
    else by = y - h / 2;
    const est = { x: bx, y: by, w, h };
    this.texts.push({ id, kind, label, est, owner, x, y, anchor, opts });
    if (opts.track !== false) this.touch(bx, bx + w);
    return id;
  }
  // label position over a message from x1 to x2: centred over the gap next to the source
  labelX(fromId, toId, x1, x2, at) {
    if (typeof at === "number") return at;
    if (at === "mid") return (x1 + x2) / 2;
    const dir = Math.sign(x2 - x1) || 1;
    const xs = this.order.map((i) => this.parts[i].x).sort((a, b) => a - b);
    const src = this.parts[fromId] ? this.parts[fromId].x : x1;
    const next = dir > 0 ? xs.find((v) => v > src + 1) : [...xs].reverse().find((v) => v < src - 1);
    const end = next === undefined ? x2 : (dir > 0 ? Math.min(next, x2) : Math.max(next, x2));
    return (x1 + end) / 2;
  }
  num(label) { return this.number ? `${++this.n}: ${label}` : label; }

  // ---------- messages ----------
  arrow(kind, x1, x2, y, label, fromId, toId, opts) {
    const id = `A${this.k++}`;
    this.arrows.push({ id, kind, pts: [[x1, y], [x2, y]] });
    this.touch(x1, x2);
    // the actor's activation starts with its first message and ends after its last
    for (const pid of [fromId, toId]) {
      const p = pid && this.parts[pid];
      if (p && p.kind === "actor") { if (p.open[0] && p.open[0].y0 === null) p.open[0].y0 = y - 8; p.lastY = y; }
    }
    if (label) {
      if (fromId && toId) this.labels.push({ from: fromId, to: toId, w: textW(label) });
      const lines = String(label).split("\n").length;
      // labels are centred over the arrow, as in the template
      this.text("msg", label, opts.at !== undefined ? this.labelX(fromId, toId, x1, x2, opts.at) : (x1 + x2) / 2, y - 1, "south", id);
      return lines;
    }
    return 1;
  }
  rowFor(label) { return LINE * String(label || "x").split("\n").length; }

  // synchronous call; starts an activation on `to`
  call(from, to, label, opts = {}) {
    const y = this.y + this.rowFor(label) + 2;
    const fx = this.P(from).x, tx = this.P(to).x;
    const dir = Math.sign(tx - fx);
    const x1 = this.edgeX(from, dir);
    const p = this.P(to);
    const L = p.open.length;
    const c = p.x + L * NEST;
    const x2 = c - dir * BAR / 2;
    this.arrow("call", x1, x2, y, this.num(label), from, to, opts);
    this.touch(c - BAR / 2 - 2, c + BAR / 2 + 2);
    p.open.push({ y0: y, c });
    this.y = y + 9;
    return this;
  }
  // reply; ends the activation of `from` unless end === false
  ret(from, to, label, { end = true, at } = {}) {
    const y = this.y + (label ? this.rowFor(label) : 0) + 2;
    const fx = this.P(from).x, tx = this.P(to).x;
    const dir = Math.sign(tx - fx);
    const x1 = this.edgeX(from, dir);
    const x2 = this.edgeX(to, -dir);
    this.arrow("ret", x1, x2, y, label, from, to, { at });
    if (end) this.close(from, y);
    this.y = y + 9;
    return this;
  }
  close(id, y) {
    const p = this.P(id);
    const b = p.open.pop();
    if (!b) throw new Error(`${this.name}: no open activation on ${id}`);
    p.bars.push({ c: b.c, y0: b.y0, y1: Math.max(y, b.y0 + 8) });
  }
  // call followed directly by its reply
  callRet(from, to, label, reply, opts = {}) {
    this.call(from, to, label, opts);
    return this.ret(to, from, reply, { at: opts.retAt });
  }
  // message without activation (e.g. a screen showing something to an actor)
  msg(from, to, label, opts = {}) {
    const y = this.y + this.rowFor(label) + 2;
    const dir = Math.sign(this.P(to).x - this.P(from).x);
    this.arrow(opts.dashed ? "ret" : "call", this.edgeX(from, dir), this.edgeX(to, -dir), y, opts.plain ? label : this.num(label), from, to, opts);
    this.y = y + 9;
    return this;
  }
  // self call with a short nested activation; label to the right of the loop
  self(id, label) {
    const p = this.P(id);
    const y = this.y + 6;
    const xr = this.edgeX(id, 1);
    const L = p.open.length;
    const c = p.x + L * NEST;
    const y2 = y + 16;
    const id2 = `A${this.k++}`;
    this.arrows.push({ id: id2, kind: "self", pts: [[xr, y], [xr + 26, y], [xr + 26, y2], [c + BAR / 2, y2]] });
    this.touch(xr, xr + 26);
    this.text("msg", this.num(label), xr + 30, y + 8, "west", id2);
    this.labels.push({ self: id, w: textW(label) });
    p.bars.push({ c, y0: y2 - 4, y1: y2 + 10 });
    this.y = y2 + 16;
    return this;
  }
  // message from the diagram frame (gate) to a part, and the reply back to the gate
  gateCall(to, label, opts = {}) {
    const y = this.y + this.rowFor(label) + 2;
    const p = this.P(to);
    const c = p.x + p.open.length * NEST;
    const x1 = this.gateX();
    this.arrow("call", x1, c - BAR / 2, y, this.num(label), null, to, { at: opts.at ?? (x1 + c - BAR / 2) / 2 });
    p.open.push({ y0: y, c });
    this.y = y + 9;
    return this;
  }
  gateRet(from, label, { end = true } = {}) {
    const y = this.y + this.rowFor(label) + 2;
    const x1 = this.edgeX(from, -1), x2 = this.gateX();
    this.arrow("ret", x1, x2, y, label, from, null, { at: (x1 + x2) / 2 });
    if (end) this.close(from, y);
    this.y = y + 9;
    return this;
  }
  gateX() { return this.left - this.gate; }

  // Gaps between lifelines that fit every label: a centred message label must
  // fit between the bars at both ends, a self-call label must end before the
  // next lifeline, and neighbouring header names must not touch.
  neededGaps() {
    const g = [...this.gaps];
    const idx = (id) => this.order.indexOf(id);
    const heads = this.order.map((id) => textW(this.P(id).kind === "actor" ? this.P(id).name : `:${this.P(id).name}`) + 6);
    for (let i = 0; i < g.length; i++) g[i] = Math.max(g[i], (heads[i] + heads[i + 1]) / 2 + 14);
    for (const l of this.labels.filter((l) => l.self)) {
      const i = idx(l.self);
      if (i < g.length) g[i] = Math.max(g[i], 30 + BAR + NEST + l.w + 14);
    }
    const spans = this.labels.filter((l) => !l.self).map((l) => {
      const [a, b] = [idx(l.from), idx(l.to)].sort((p, q) => p - q);
      return { a, b, need: l.w + 2 * BAR + NEST + 16 };
    }).sort((p, q) => (p.b - p.a) - (q.b - q.a));
    for (const s of spans) {
      const have = g.slice(s.a, s.b).reduce((p, q) => p + q, 0);
      if (have < s.need) { const add = (s.need - have) / (s.b - s.a); for (let i = s.a; i < s.b; i++) g[i] += add; }
    }
    return g.map((v) => Math.ceil(v / 5) * 5);
  }
  // build a diagram twice when needed so that the gaps fit the labels
  static build(make) {
    let d = make();
    const g = d.neededGaps();
    if (g.some((v, i) => v !== d.gaps[i])) { Sequence.gapOverride[d.name] = g; d = make(); }
    return d;
  }
  space(h) { this.y += h; return this; }

  // ---------- combined fragments ----------
  // operands: [[guard, () => {...}], ...]
  frag(op, operands, { pad = 10 } = {}) {
    const f = { op, x0: Infinity, x1: -Infinity, y0: this.y + 4, seps: [], guards: [], pad };
    this.fragStack.push(f);
    this.y = f.y0 + 21;
    operands.forEach(([guard, body], i) => {
      if (i > 0) {
        const sy = this.y + 4;
        f.seps.push(sy);
        this.y = sy + 20;
        f.guards.push({ text: `[${guard}]`, y: sy + 2, sep: true });
      } else if (guard) f.guards.push({ text: `[${guard}]`, y: f.y0 + 2, sep: false });
      body();
    });
    this.fragStack.pop();
    f.y1 = this.y + 6;
    this.y = f.y1 + 6;
    // the tag and guards must fit inside the frame
    const tagW = textW(op, FONT) * 1.15 + 24;
    f.x0 -= pad; f.x1 += pad;
    f.tagW = tagW;
    // activation bars known so far (open ones run on)
    const bars = this.order.flatMap((id) => [...this.P(id).bars, ...this.P(id).open.map((b) => ({ c: b.c, y0: b.y0, y1: Infinity }))]);
    const barHit = (x0, x1, y0, y1) => bars.find((b) => x0 < b.c + BAR / 2 + 2 && x1 > b.c - BAR / 2 - 2 && y0 < b.y1 && y1 > b.y0);
    // the left border and the tag must stay clear of bars: move the frame left
    for (let n = 0; n < 10; n++) {
      const b = barHit(f.x0 - 1, f.x0 + tagW, f.y0, f.y1);
      if (!b) break;
      f.x0 = b.c - BAR / 2 - 4 - tagW;
    }
    // the right border must not run along a bar
    for (let n = 0; n < 10; n++) {
      const b = barHit(f.x1 - 1, f.x1 + 1, f.y0, f.y1);
      if (!b) break;
      f.x1 = b.c + BAR / 2 + 6;
    }
    // guards: start after the tag (or at the left for separators), skip past bars
    for (const g of f.guards) {
      const w = textW(g.text) + 3;
      let x = g.sep ? f.x0 + 6 : f.x0 + tagW + 6;
      for (let n = 0; n < 10; n++) {
        const b = barHit(x, x + w, g.y, g.y + LINE + 2);
        if (!b) break;
        x = b.c + BAR / 2 + 4;
      }
      g.x = x;
      if (x + w + 6 > f.x1) f.x1 = x + w + 6;
    }
    for (const g of this.fragStack) { g.x0 = Math.min(g.x0, f.x0); g.x1 = Math.max(g.x1, f.x1); }
    this.touch(f.x0, f.x1);
    this.frames.push(f);
    // register frame texts
    this.text("tag", op, f.x0 + 4, f.y0 + 1, "north west", f, { track: false, bold: true });
    for (const g of f.guards) this.text("guard", g.text, g.x, g.y, "north west", f, { track: false });
    return this;
  }
  alt(...operands) { return this.frag("alt", operands); }
  opt(guard, body) { return this.frag("opt", [[guard, body]]); }
  loop(guard, body) { return this.frag("loop", [[guard, body]]); }
  // interaction use covering the given parts
  ref(label, ids) {
    const xs = ids.map((i) => this.P(i).x);
    const lines = String(label).split("\n");
    const w = Math.max(Math.max(...xs) - Math.min(...xs) + 68, Math.max(...lines.map((l) => textW(l))) + 40);
    const x0 = (Math.max(...xs) + Math.min(...xs)) / 2 - w / 2;
    const y0 = this.y + 6, y1 = y0 + 29 + LINE * lines.length;
    const f = { op: "ref", ref: true, x0, x1: x0 + w, y0, y1, seps: [], guards: [], tagW: textW("ref") * 1.15 + 24 };
    this.frames.push(f);
    this.touch(f.x0, f.x1);
    this.text("tag", "ref", x0 + 4, y0 + 1, "north west", f, { track: false, bold: true });
    this.text("refl", label, (f.x0 + f.x1) / 2, y0 + 21 + (LINE * lines.length) / 2, "center", f, { track: false });
    this.y = y1 + 4;
    return this;
  }

  // ---------- output ----------
  finish() {
    const endY = this.y + 14;
    for (const id of this.order) {
      const p = this.P(id);
      while (p.open.length) {
        // an actor stays active until its last message, as in the template
        const last = p.kind === "actor" && p.lastY ? p.lastY + 10 : endY - 6;
        this.close(id, p.open.length === 1 && p.kind === "actor" ? last : endY - 6);
      }
    }
    this.endY = endY;
    return this;
  }

  // draw.io (mxGraph) XML with explicit geometry
  xml() {
    const cells = [];
    let n = 2;
    const id = () => `c${n++}`;
    const vtx = (value, x, y, w, h, style) => cells.push(
      `<mxCell id="${id()}" value="${esc(value)}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" as="geometry"/></mxCell>`);
    const line = (pts, style) => {
      const [p0, p1] = [pts[0], pts[pts.length - 1]];
      const mid = pts.slice(1, -1).map(([x, y]) => `<mxPoint x="${r(x)}" y="${r(y)}"/>`).join("");
      cells.push(`<mxCell id="${id()}" value="" style="${style}" edge="1" parent="1">` +
        `<mxGeometry relative="1" as="geometry"><mxPoint x="${r(p0[0])}" y="${r(p0[1])}" as="sourcePoint"/>` +
        `<mxPoint x="${r(p1[0])}" y="${r(p1[1])}" as="targetPoint"/>` +
        (mid ? `<Array as="points">${mid}</Array>` : "") + `</mxGeometry></mxCell>`);
    };
    const F = `fontFamily=Helvetica;fontSize=${FONT};`;
    // headers: icon, then the underlined instance name below it
    const heads = [];
    for (const pid of this.order) {
      const p = this.P(pid), x = p.x, y = this.headTop;
      const icon = {
        actor: [x - 12, y, 24, 44, "shape=umlActor;html=1;outlineConnect=0;"],
        boundary: [x - 29, y + 6, 48, 38, "shape=umlBoundary;html=1;whiteSpace=wrap;"],
        control: [x - 18, y + 4, 36, 40, "ellipse;shape=umlControl;html=1;whiteSpace=wrap;"],
        entity: [x - 19, y + 6, 38, 38, "ellipse;shape=umlEntity;html=1;whiteSpace=wrap;"],
      }[p.kind];
      p.icon = icon;
      const label = p.kind === "actor" ? p.name : `:${p.name}`;
      const w = textW(label) + 6;
      const t = { id: `H_${pid}`, kind: "head", label, x, y: y + 47, anchor: "north", opts: {},
        est: { x: x - w / 2, y: y + 47, w, h: LINE + 2 } };
      this.texts.push(t);
      heads.push(t);
    }
    const fx0 = Math.min(this.minX, ...heads.map((h) => h.est.x)) - 16;
    const fx1 = Math.max(this.maxX, ...heads.map((h) => h.est.x + h.est.w)) + 16;
    if (this.gate > 0) for (const a of this.arrows) for (const p of a.pts) if (Math.abs(p[0] - this.gateX()) < 0.01) p[0] = fx0;
    // sd frame: the tag holds the use case code, as in the template
    const tagW = Math.max(56, textW(this.title, 12) + 22);
    this.sd = { x0: fx0, x1: fx1, y0: 0, y1: this.endY + 10, tw: tagW };
    vtx(this.title, fx0, 0, fx1 - fx0, this.endY + 10,
      `shape=umlFrame;whiteSpace=wrap;html=1;width=${r(tagW)};height=26;fontFamily=Helvetica;fontSize=12;fillColor=none;`);
    this.texts.push({ id: "SDT", kind: "sdtitle", label: this.title, x: fx0 + 4, y: 4, anchor: "north west", opts: {},
      est: { x: fx0 + 4, y: 4, w: tagW - 12, h: 18 } });
    // lifelines
    for (const pid of this.order) line([[this.P(pid).x, this.lifeTop - 4], [this.P(pid).x, this.endY]],
      "endArrow=none;html=1;dashed=1;rounded=0;strokeWidth=1;");
    // fragment frames (ref frames later, above lifelines and bars)
    const frame = (f) => {
      vtx(f.op, f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0,
        `shape=umlFrame;whiteSpace=wrap;html=1;width=${r(f.tagW)};height=19;${F}fontStyle=1;` +
        (f.ref ? "fillColor=#ffffff;swimlaneFillColor=#ffffff;" : "fillColor=none;"));
      for (const s of f.seps) line([[f.x0, s], [f.x1, s]], "endArrow=none;html=1;dashed=1;rounded=0;");
    };
    for (const f of this.frames.filter((f) => !f.ref)) frame(f);
    // activation bars
    for (const pid of this.order) for (const b of this.P(pid).bars)
      vtx("", b.c - BAR / 2, b.y0, BAR, b.y1 - b.y0, "html=1;fillColor=#ffffff;");
    for (const f of this.frames.filter((f) => f.ref)) frame(f);
    // icons on top of the lifeline ends
    for (const pid of this.order) { const [x, y, w, h, st] = this.P(pid).icon; vtx("", x, y, w, h, st + "fillColor=#ffffff;"); }
    // messages
    for (const a of this.arrows) {
      const st = a.kind === "ret"
        ? "html=1;rounded=0;dashed=1;endArrow=open;endFill=0;endSize=8;"
        : "html=1;rounded=0;endArrow=block;endFill=1;endSize=8;";
      line(a.pts, st);
    }
    // texts (frame tags are drawn by the umlFrame shapes themselves)
    for (const t of this.texts) {
      if (t.kind === "tag" || t.kind === "sdtitle") continue;
      const b = t.est;
      const align = t.anchor.includes("west") ? "left" : t.anchor.includes("east") ? "right" : "center";
      const style = `text;html=1;align=${align};verticalAlign=middle;spacing=0;spacingLeft=1;spacingRight=1;${F}` +
        (t.kind === "head" ? "fontStyle=4;" : "") +
        (t.kind === "msg" || t.kind === "guard" ? "fillColor=#ffffff;" : "fillColor=none;") + "strokeColor=none;";
      vtx(String(t.label).replace(/"([^"]*)"/g, "“$1”").replace(/\n/g, "<br>"), b.x, b.y, b.w, b.h, style);
    }
    return `<mxfile host="drawio"><diagram id="${esc(this.name)}" name="${esc(this.name)}">` +
      `<mxGraphModel dx="1200" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0"><root>` +
      `<mxCell id="0"/><mxCell id="1" parent="0"/>` + cells.join("") + `</root></mxGraphModel></diagram></mxfile>`;
  }

  save() {
    const src = path.join(FIG_DIR, "src", `${this.name}.drawio`);
    fs.writeFileSync(src, this.xml());
    execFileSync(DRAWIO, ["-x", "-f", "pdf", "--crop", "-o", path.join(FIG_DIR, `${this.name}.pdf`), src]);
    execFileSync(DRAWIO, ["-x", "-f", "png", "-s", "2", "-b", "10", "-o", path.join(FIG_DIR, "png", `${this.name}.png`), src]);
    return this.check();
  }

  // ---------- quality checks (real text boxes from TeX) ----------
  check(boxes = {}) {
    const issues = [];
    const box = (t) => boxes[t.id] || t.est;
    const hit = (a, b, m = 0) => a.x < b.x + b.w - m && b.x < a.x + a.w - m && a.y < b.y + b.h - m && b.y < a.y + a.h - m;
    const name = (t) => `"${String(t.label).replace(/\n/g, " ")}"`;
    const T = this.texts;
    // 1. text over text
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      if (T[i].kind === "sdtitle" || T[j].kind === "sdtitle") continue;
      if (hit(box(T[i]), box(T[j]), 0.5)) issues.push(`text ${name(T[i])} overlaps ${name(T[j])}`);
    }
    // 2. text over lifelines and activation bars
    for (const t of T) {
      if (t.kind === "head" || t.kind === "sdtitle") continue;
      const b = box(t);
      for (const id of this.order) {
        const p = this.P(id);
        if (t.kind === "refl") continue;  // ref label sits on the white ref frame
        for (const bar of p.bars) if (hit(b, { x: bar.c - BAR / 2, y: bar.y0, w: BAR, h: bar.y1 - bar.y0 }, 0.5))
          issues.push(`text ${name(t)} overlaps an activation bar of ${id}`);
      }
    }
    // 3. text over arrows (other than its own)
    for (const t of T) {
      if (t.kind === "head" || t.kind === "sdtitle") continue;
      const b = box(t);
      for (const a of this.arrows) {
        if (a.id === t.owner) continue;
        for (let k = 0; k < a.pts.length - 1; k++) {
          const [p, q] = [a.pts[k], a.pts[k + 1]];
          const seg = { x: Math.min(p[0], q[0]), y: Math.min(p[1], q[1]) - 0.3, w: Math.abs(q[0] - p[0]) + 0.01, h: Math.abs(q[1] - p[1]) + 0.6 };
          if (hit(b, seg, 0)) { issues.push(`text ${name(t)} is crossed by an arrow`); break; }
        }
      }
    }
    // 4. message labels over fragment borders, and texts outside their frame
    for (const t of T.filter((t) => t.kind === "msg")) {
      const b = box(t);
      for (const f of this.frames) {
        const lines = [
          { x: f.x0, y: f.y0, w: 0.01, h: f.y1 - f.y0 }, { x: f.x1, y: f.y0, w: 0.01, h: f.y1 - f.y0 },
          { x: f.x0, y: f.y0, w: f.x1 - f.x0, h: 0.01 }, { x: f.x0, y: f.y1, w: f.x1 - f.x0, h: 0.01 },
          ...f.seps.map((s) => ({ x: f.x0, y: s, w: f.x1 - f.x0, h: 0.01 })),
        ];
        if (lines.some((l) => hit(b, l, 0))) issues.push(`text ${name(t)} crosses a ${f.op} frame border`);
        if (f.ref && hit(b, { x: f.x0, y: f.y0, w: f.x1 - f.x0, h: f.y1 - f.y0 })) issues.push(`text ${name(t)} is under a ref frame`);
      }
    }
    // 4a. arrows must not pass through activation bars of other lifelines
    for (const a of this.arrows) for (let k = 0; k < a.pts.length - 1; k++) {
      const [p, q] = [a.pts[k], a.pts[k + 1]];
      if (Math.abs(p[1] - q[1]) > 0.1) continue;
      const lo = Math.min(p[0], q[0]) + 1, hi = Math.max(p[0], q[0]) - 1;
      for (const id of this.order) for (const bar of this.P(id).bars)
        if (bar.c + BAR / 2 > lo && bar.c - BAR / 2 < hi && p[1] > bar.y0 + 0.5 && p[1] < bar.y1 - 0.5)
          issues.push(`an arrow at y=${Math.round(p[1])} passes through an activation bar of ${id}`);
    }
    // 4b. fragment borders must not run along an activation bar
    for (const f of this.frames) for (const id of this.order) for (const bar of this.P(id).bars) {
      const bx0 = bar.c - BAR / 2 - 1, bx1 = bar.c + BAR / 2 + 1;
      const yOverlap = bar.y0 < f.y1 && bar.y1 > f.y0;
      if (yOverlap && ((f.x0 > bx0 && f.x0 < bx1) || (f.x1 > bx0 && f.x1 < bx1))) issues.push(`${f.op} frame border runs along an activation bar of ${id}`);
    }
    for (const t of T.filter((t) => ["guard", "tag", "refl"].includes(t.kind))) {
      const b = box(t), f = t.owner;
      if (b.x + b.w > f.x1 - 1) issues.push(`text ${name(t)} sticks out of its ${f.op} frame`);
    }
    // 5. headers must not overlap each other; everything inside the sd frame
    const sdt = box(T.find((t) => t.kind === "sdtitle"));
    if (sdt.x + sdt.w > this.sd.x0 + this.sd.tw - 4) issues.push("sd title wider than its tag");
    for (const t of T) {
      const b = box(t);
      if (b.x < this.sd.x0 + 1 || b.x + b.w > this.sd.x1 - 1) issues.push(`text ${name(t)} outside the sd frame`);
    }
    const width = this.sd.x1 - this.sd.x0, height = this.sd.y1;
    return { name: this.name, parts: this.order.length, messages: this.arrows.length, width: Math.round(width), height: Math.round(height), issues };
  }
}
