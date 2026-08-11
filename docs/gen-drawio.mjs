// Sinh file .drawio (mxGraph XML) từ các sơ đồ luồng Mermaid, với bố cục do script tự đặt
// tọa độ nên kiểm soát được đường đi — khác với Mermaid để dagre tự dàn và sinh đường cắt nhau.
//
// Quy tắc bố cục (bảo đảm không cắt đường):
//  - Nhánh chính (happy path) chạy dọc ở cột 0.
//  - Mỗi nhánh rẽ treo sang trái, cột riêng; nhánh bắt đầu ở hàng DƯỚI node quyết định
//    nên đoạn nối ngang từ quyết định luôn đi qua vùng trống.
//  - Nhánh chính chỉ đi tiếp sau khi mọi nhánh rẽ tại bước đó đã kết thúc,
//    nhờ vậy các cột nhánh không bao giờ chồng khoảng y với nhau.
//  - Cạnh quay ngược và cạnh gộp về node đã đặt đi theo kênh dọc riêng bên trái ngoài cùng,
//    mỗi cạnh một kênh nên không đè lên nhau.
//  - Toàn bộ cạnh dùng edgeStyle=orthogonalEdgeStyle, rounded=0 -> gấp khúc 90 độ.
//
// Chạy: node docs/gen-drawio.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'diagrams');

const COL = 420; // khoảng cách giữa các cột
const ROWGAP = 50; // khoảng hở dọc giữa hai node
const WMIN = 220; // bề rộng nhỏ nhất của node
const WMAX = 340; // bề rộng lớn nhất của node
const CH_PITCH = 60; // khoảng cách giữa các kênh đi dây
const MARGIN = 60;

const STYLE = {
  stadium:
    'rounded=1;arcSize=50;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;whiteSpace=wrap;html=1;fontSize=12;spacing=6;',
  diamond:
    'rhombus;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;whiteSpace=wrap;html=1;fontSize=12;spacing=6;',
  rect: 'rounded=0;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;whiteSpace=wrap;html=1;fontSize=12;spacing=6;',
  cylinder:
    'shape=cylinder3;boundedLbl=1;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;whiteSpace=wrap;html=1;fontSize=12;',
  circle:
    'ellipse;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;whiteSpace=wrap;html=1;fontSize=12;',
};

const EDGE_STYLE =
  'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#000000;fontColor=#000000;jettySize=auto;endArrow=block;endFill=1;fontSize=11;';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// --- Đọc sơ đồ Mermaid -------------------------------------------------------

const SHAPES = [
  [/^\(\["(.*)"\]\)$/s, 'stadium'],
  [/^\{"(.*)"\}$/s, 'diamond'],
  [/^\[\("(.*)"\)\]$/s, 'cylinder'],
  [/^\(\("(.*)"\)\)$/s, 'circle'],
  [/^\["(.*)"\]$/s, 'rect'],
];

const DECL_RE =
  /([A-Za-z][A-Za-z0-9]*)\s*(\(\[".*?"\]\)|\{".*?"\}|\[\(".*?"\)\]|\(\(".*?"\)\)|\[".*?"\])/g;
const EDGE_RE =
  /([A-Za-z][A-Za-z0-9]*)\s*(?:\(\[".*?"\]\)|\{".*?"\}|\[\(".*?"\)\]|\(\(".*?"\)\)|\[".*?"\])?\s*-->(?:\|([^|]*)\|)?\s*([A-Za-z][A-Za-z0-9]*)/;

function parseMermaid(src) {
  const body = src.slice(src.indexOf('}}%%') + 4);
  const nodes = new Map();
  const edges = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('flowchart') || line.startsWith('%%')) continue;
    if (line.startsWith('subgraph') || line === 'end' || line.startsWith('direction')) {
      return null; // có subgraph: bố cục dạng làn, không xử lý ở đây
    }
    for (const m of line.matchAll(DECL_RE)) {
      if (nodes.has(m[1])) continue;
      for (const [re, shape] of SHAPES) {
        const hit = m[2].match(re);
        if (hit) {
          nodes.set(m[1], { id: m[1], shape, label: hit[1].replace(/<br\s*\/?>/g, '\n') });
          break;
        }
      }
    }
    const e = line.match(EDGE_RE);
    if (e) edges.push({ from: e[1], label: (e[2] ?? '').trim(), to: e[3] });
  }
  for (const e of [...edges]) {
    for (const id of [e.from, e.to]) {
      if (!nodes.has(id)) nodes.set(id, { id, shape: 'rect', label: id });
    }
  }
  return { nodes, edges };
}

// --- Kích thước node ---------------------------------------------------------

// Ước lượng bề rộng chữ ở fontSize 12 (tiếng Việt có dấu nên tính rộng tay một chút)
const CHAR_W = 6.6;
const LINE_H = 17;

function sizeOf(node) {
  const textW = node.label
    .split('\n')
    .reduce((acc, l) => acc + l.length * CHAR_W, 0);

  if (node.shape === 'circle') {
    const d = Math.max(160, Math.ceil(Math.sqrt(textW * LINE_H) * 2.2));
    return { w: d, h: d };
  }

  // chọn bề rộng sao cho chữ nằm gọn trong 1-3 dòng
  const hardLines = node.label.split('\n').length;
  let w = Math.min(WMAX, Math.max(WMIN, Math.ceil(textW / Math.max(1, hardLines)) + 34));
  let lines = node.label
    .split('\n')
    .reduce((acc, l) => acc + Math.max(1, Math.ceil((l.length * CHAR_W) / (w - 26))), 0);
  while (lines > 3 && w < WMAX) {
    w = Math.min(WMAX, w + 40);
    lines = node.label
      .split('\n')
      .reduce((acc, l) => acc + Math.max(1, Math.ceil((l.length * CHAR_W) / (w - 26))), 0);
  }

  if (node.shape === 'diamond') {
    // hình thoi chỉ dùng được phần giữa nên phải nới cả hai chiều
    return { w: Math.round(w * 1.45), h: Math.max(110, lines * LINE_H + 90) };
  }
  return { w, h: Math.max(52, lines * LINE_H + 24) };
}

// --- Bố cục ------------------------------------------------------------------

function layout(graph) {
  const { nodes, edges } = graph;
  const out = new Map();
  for (const n of nodes.keys()) out.set(n, []);
  for (const e of edges) out.get(e.from).push(e);

  const start =
    [...nodes.values()].find(
      (n) => n.shape === 'stadium' && /^Bắt đầu/i.test(n.label),
    ) ?? [...nodes.values()][0];

  // Độ dài đường đi dài nhất tới điểm kết thúc, dùng để chọn nhánh chính
  const depth = new Map();
  const visiting = new Set();
  const longest = (id) => {
    if (depth.has(id)) return depth.get(id);
    if (visiting.has(id)) return 0; // cạnh quay ngược
    visiting.add(id);
    let best = 0;
    for (const e of out.get(id)) best = Math.max(best, 1 + longest(e.to));
    visiting.delete(id);
    depth.set(id, best);
    return best;
  };
  for (const id of nodes.keys()) longest(id);

  const placed = new Map();
  const crossEdges = [];
  const fanRoutes = new Map(); // cạnh fan-out -> tọa độ x của trục dọc (chưa dịch gốc)
  let maxCol = 0;

  // Đặt một chuỗi node theo chiều dọc ở cột col, bắt đầu từ yTop. Trả về đáy của chuỗi.
  function placeChain(startId, col, yTop) {
    let cur = startId;
    let y = yTop;
    while (cur && !placed.has(cur)) {
      const node = nodes.get(cur);
      const { w, h } = sizeOf(node);
      placed.set(cur, { ...node, col, x: -col * COL, y, w, h });
      maxCol = Math.max(maxCol, col);

      const succ = out.get(cur);
      if (succ.length === 0) break;

      // Nhánh chính = nhánh chưa đặt và còn đi xa nhất.
      // Phải loại các cạnh trỏ về node đã đặt (vòng lặp), nếu không nhánh chính
      // sẽ bị đứt và phần đuôi luồng bị đẩy sang cột phụ.
      const fresh = succ.filter((e) => !placed.has(e.to));
      let main = fresh[0] ?? null;
      for (const e of fresh) if (longest(e.to) > longest(main.to)) main = e;

      let bottom = y + h;
      const branchEdges = succ.filter((e) => e !== main && !placed.has(e.to));
      for (const e of succ) {
        if (e !== main && placed.has(e.to)) crossEdges.push(e);
      }

      if (branchEdges.length >= 2) {
        // Từ 2 nhánh rẽ trở lên: xếp chồng dọc trong cùng một cột, nối bằng một trục dọc
        // đặt ở khoảng trống giữa hai cột. Nếu tách mỗi nhánh một cột thì sơ đồ rộng
        // gấp nhiều lần và các nhãn dồn hết vào cùng một đoạn ngang nên đè lên nhau.
        const trunkX = -(col * COL) - COL / 2;
        let ny = y + h + ROWGAP;
        for (const e of branchEdges) {
          const b = placeChain(e.to, col + 1, ny);
          fanRoutes.set(e, trunkX);
          ny = b + ROWGAP;
          bottom = Math.max(bottom, b);
        }
      } else {
        let side = 1;
        for (const e of branchEdges) {
          const b = placeChain(e.to, col + side, y + h + ROWGAP);
          bottom = Math.max(bottom, b);
          side++;
        }
      }

      if (!main) break; // mọi nhánh còn lại đều trỏ về node đã đặt
      y = bottom + ROWGAP;
      cur = main.to;
    }
    let bottom = yTop;
    for (const p of placed.values()) bottom = Math.max(bottom, p.y + p.h);
    return bottom;
  }

  placeChain(start.id, 0, 0);

  // Node còn sót (không tới được từ Start) — xếp tiếp phía dưới
  let tail = Math.max(0, ...[...placed.values()].map((p) => p.y + p.h)) + ROWGAP;
  for (const id of nodes.keys()) {
    if (placed.has(id)) continue;
    const node = nodes.get(id);
    const { w, h } = sizeOf(node);
    placed.set(id, { ...node, col: 0, x: 0, y: tail, w, h });
    tail += h + ROWGAP;
  }

  // Chuẩn hóa toàn bộ tọa độ về góc trên trái, chừa chỗ cho các kênh đi dây bên trái
  const channelCount = crossEdges.length;
  const channelSpace = channelCount * CH_PITCH + (channelCount ? CH_PITCH : 0);
  const minX = Math.min(...[...placed.values()].map((p) => p.x - p.w / 2));
  const offsetX = MARGIN + channelSpace - minX;
  for (const p of placed.values()) {
    p.x = p.x - p.w / 2 + offsetX;
    p.y += MARGIN;
  }
  for (const [e, tx] of fanRoutes) fanRoutes.set(e, tx + offsetX);

  // Gán kênh dọc cho từng cạnh quay ngược / cạnh gộp: cạnh có khoảng y ngắn nằm trong kênh gần hơn
  const leftMost = Math.min(...[...placed.values()].map((p) => p.x));
  const ranked = crossEdges
    .map((e) => {
      const a = placed.get(e.from);
      const b = placed.get(e.to);
      return { e, span: Math.abs(a.y - b.y) };
    })
    .sort((p, q) => p.span - q.span);
  const channelOf = new Map();
  ranked.forEach(({ e }, i) => channelOf.set(e, leftMost - CH_PITCH * (i + 1)));

  return { placed, edges, crossEdges: new Set(crossEdges), channelOf, fanRoutes };
}

// --- Xuất mxGraph XML --------------------------------------------------------

function toDrawio(name, lay) {
  const { placed, edges, crossEdges, channelOf, fanRoutes } = lay;
  const cells = [];

  for (const p of placed.values()) {
    cells.push(
      `        <mxCell id="${p.id}" value="${esc(p.label).replace(/\n/g, '&#10;')}" style="${STYLE[p.shape]}" vertex="1" parent="1">\n` +
        `          <mxGeometry x="${Math.round(p.x)}" y="${Math.round(p.y)}" width="${p.w}" height="${p.h}" as="geometry" />\n` +
        `        </mxCell>`,
    );
  }

  edges.forEach((e, i) => {
    const a = placed.get(e.from);
    const b = placed.get(e.to);
    if (!a || !b) return;
    let style = EDGE_STYLE;
    let points = '';

    if (crossEdges.has(e)) {
      const chx = Math.round(channelOf.get(e));
      style += 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;';
      points =
        `\n            <Array as="points">\n` +
        `              <mxPoint x="${chx}" y="${Math.round(a.y + a.h / 2)}" />\n` +
        `              <mxPoint x="${chx}" y="${Math.round(b.y + b.h / 2)}" />\n` +
        `            </Array>`;
    } else if (fanRoutes.has(e)) {
      // fan-out: ra cạnh trái node quyết định, xuống trục dọc dùng chung, vào cạnh phải nhánh
      const tx = Math.round(fanRoutes.get(e));
      style += 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;';
      points =
        `\n            <Array as="points">\n` +
        `              <mxPoint x="${tx}" y="${Math.round(a.y + a.h / 2)}" />\n` +
        `              <mxPoint x="${tx}" y="${Math.round(b.y + b.h / 2)}" />\n` +
        `            </Array>`;
    } else if (a.col === b.col) {
      // cùng cột: đi thẳng từ đáy xuống đỉnh
      style += 'exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
    } else if (b.col > a.col) {
      // rẽ sang trái rồi xuống: ra cạnh trái, vào cạnh trên
      style += 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
      points =
        `\n            <Array as="points">\n` +
        `              <mxPoint x="${Math.round(b.x + b.w / 2)}" y="${Math.round(a.y + a.h / 2)}" />\n` +
        `            </Array>`;
    } else {
      style += 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
      points =
        `\n            <Array as="points">\n` +
        `              <mxPoint x="${Math.round(b.x + b.w / 2)}" y="${Math.round(a.y + a.h / 2)}" />\n` +
        `            </Array>`;
    }

    const eid = `edge${i}`;
    cells.push(
      `        <mxCell id="${eid}" style="${style}" edge="1" parent="1" source="${e.from}" target="${e.to}">\n` +
        `          <mxGeometry relative="1" as="geometry">${points}\n          </mxGeometry>\n` +
        `        </mxCell>`,
    );
    if (e.label) {
      if (fanRoutes.has(e)) {
        // Nhánh fan-out: đặt nhãn bằng tọa độ tuyệt đối, canh giữa đoạn ngang nối
        // từ trục dọc vào node. Để draw.io tự canh thì nhãn bị node đè lên.
        const tx = fanRoutes.get(e);
        const runLeft = b.x + b.w;
        const cx = (runLeft + tx) / 2;
        const lw = Math.max(60, Math.abs(tx - runLeft) - 12);
        cells.push(
          `        <mxCell id="${eid}lbl" value="${esc(e.label)}" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=11;fontColor=#000000;labelBackgroundColor=#ffffff;" vertex="1" connectable="0" parent="1">\n` +
            `          <mxGeometry x="${Math.round(cx - lw / 2)}" y="${Math.round(b.y + b.h / 2 - 26)}" width="${Math.round(lw)}" height="20" as="geometry" />\n` +
            `        </mxCell>`,
        );
      } else {
        // Nhãn đặt lệch khỏi đường để không đè lên node: cạnh dọc thì đẩy sang phải,
        // cạnh rẽ ngang thì bám đoạn ngang ngay sau node nguồn và đẩy lên trên.
        const vertical = a.col === b.col && !crossEdges.has(e);
        const rel = vertical ? 0 : -0.75;
        const off = vertical ? 'x="18" y="0"' : 'x="0" y="-13"';
        cells.push(
          `        <mxCell id="${eid}lbl" value="${esc(e.label)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=11;fontColor=#000000;labelBackgroundColor=#ffffff;" vertex="1" connectable="0" parent="${eid}">\n` +
            `          <mxGeometry x="${rel}" relative="1" as="geometry"><mxPoint as="offset" ${off} /></mxGeometry>\n` +
            `          </mxCell>`,
        );
      }
    }
  });

  const maxX = Math.max(...[...placed.values()].map((p) => p.x + p.w)) + MARGIN;
  const maxY = Math.max(...[...placed.values()].map((p) => p.y + p.h)) + MARGIN;

  return (
    `<mxfile host="app.diagrams.net" type="device">\n` +
    `  <diagram id="${esc(name)}" name="${esc(name)}">\n` +
    `    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.round(maxX)}" pageHeight="${Math.round(maxY)}" math="0" shadow="0">\n` +
    `      <root>\n        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n` +
    cells.join('\n') +
    `\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n`
  );
}

// --- Chạy --------------------------------------------------------------------

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('_flow.mmd'))
  .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]));

let made = 0;
const skipped = [];
for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const graph = parseMermaid(src);
  if (!graph) {
    skipped.push(`${f} (có subgraph/làn)`);
    continue;
  }
  const hasStart = [...graph.nodes.values()].some(
    (n) => n.shape === 'stadium' && /^Bắt đầu/i.test(n.label),
  );
  if (!hasStart) {
    skipped.push(`${f} (sơ đồ cấu trúc, không có luồng Bắt đầu - Kết thúc)`);
    continue;
  }
  const base = f.replace(/\.mmd$/, '');
  const lay = layout(graph);
  writeFileSync(join(DIR, `${base}.drawio`), toDrawio(base, lay), 'utf8');
  made++;
}

console.log(`Đã sinh ${made} file .drawio`);
if (skipped.length) console.log('Bỏ qua:\n  ' + skipped.join('\n  '));
