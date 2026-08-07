// Kiểm tra nhanh các sơ đồ luồng theo checklist SKILL mục 5:
// - nhánh cụt (node không có cạnh ra và không phải node Kết thúc)
// - cạnh ra khỏi hình thoi quyết định thiếu nhãn
// - còn sót màu trang trí (classDef fill)
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'diagrams');
// Sơ đồ cấu trúc/kiến trúc: không có luồng Bắt đầu - Kết thúc nên bỏ qua kiểm tra nhánh cụt
// 11 chức năng, 13 ý niệm, 59 context, 61 DFD, 63 component, 64 deployment,
// 65 C4 L2, 66 C4 L3, 67 package
const STRUCTURAL = new Set([11, 13, 59, 61, 63, 64, 65, 66, 67]);

let problems = 0;
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.mmd')).sort()) {
  const stt = Number(f.split('_')[0]);
  const src = readFileSync(join(DIR, f), 'utf8');
  const body = src.slice(src.indexOf('}}%%') + 4);
  const report = (msg) => {
    console.log(`[${f}] ${msg}`);
    problems++;
  };

  if (/classDef .*fill:#(?!ffffff)/.test(body)) report('còn classDef tô màu');
  if (!/'curve': 'stepAfter'/.test(src) && /flowchart/.test(body)) report('thiếu curve stepAfter');
  if (/sequenceDiagram/.test(body) && !/'mirrorActors': false/.test(src)) report('sequence thiếu mirrorActors:false');
  if (!/flowchart/.test(body)) continue;

  const decisions = new Set();
  const nodes = new Set();
  const hasOut = new Set();
  const endNodes = new Set();

  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('subgraph') || t === 'end' || t.startsWith('direction') || t.startsWith('flowchart')) continue;
    // khai báo node
    for (const m of t.matchAll(/([A-Za-z][A-Za-z0-9]*)\s*(\{|\(\[|\(\(|\[\(|\[|\()/g)) {
      nodes.add(m[1]);
      if (m[2] === '{') decisions.add(m[1]);
      if (m[2] === '([') endNodes.add(m[1]);
    }
    // cạnh: A --> B hoặc A -->|nhãn| B hoặc A --- B
    const edge = t.match(/^([A-Za-z][A-Za-z0-9]*)\s*(?:\{[^}]*\}|\[[^\]]*\]|\([^)]*\)|\(\[[^\]]*\]\))?\s*(-->|---|~~~)(\|[^|]*\|)?\s*([A-Za-z][A-Za-z0-9]*)/);
    if (edge) {
      hasOut.add(edge[1]);
      nodes.add(edge[1]);
      nodes.add(edge[4]);
      if (decisions.has(edge[1]) && !edge[3]) report(`cạnh ra khỏi quyết định ${edge[1]} thiếu nhãn: ${t}`);
    }
  }

  if (STRUCTURAL.has(stt)) continue;
  for (const n of nodes) {
    if (!hasOut.has(n) && !endNodes.has(n)) report(`nhánh cụt: node ${n} không có cạnh ra và không phải node Kết thúc`);
  }
}
console.log(problems === 0 ? 'OK — không phát hiện vấn đề' : `Tổng: ${problems} vấn đề`);
