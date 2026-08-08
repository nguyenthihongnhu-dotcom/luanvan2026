/**
 * Sinh bản .drawio cho các sơ đồ ERD từ nguồn Mermaid.
 *
 * Vì sao chỉ ERD: Mermaid vẽ tuần tự và trạng thái rất sạch, chuyển sang draw.io
 * không được gì. Riêng `erDiagram` dùng đường cong cố định trong mã nguồn render,
 * không nhận tham số `curve`, nên không ép về gấp khúc 90° được — đúng hạn chế đã
 * ghi trong README. Bản .drawio dưới đây vẽ quan hệ bằng đường gấp khúc và xếp
 * thực thể theo tầng cha - con để hạn chế đường cắt nhau.
 *
 * Chạy: node docs/gen-erd-drawio.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'diagrams');

const ENTITY_W = 250;
const HEADER_H = 30;
const ROW_H = 24;
const GAP_X = 60;
const GAP_Y = 110;

const ENTITY_STYLE =
  'shape=table;startSize=30;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=1;columnLines=0;html=1;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontSize=12;fontStyle=1;';
const ROW_STYLE =
  'shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;strokeColor=#000000;top=0;left=0;right=0;bottom=0;collapsible=0;dropTarget=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;';
const CELL_STYLE =
  'shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=8;overflow=hidden;html=1;fontSize=11;fontStyle=0;fontColor=#000000;strokeColor=none;';

/** `||--o{` một - nhiều; `||--o|` một - không hoặc một. */
const REL_STYLE = {
  '||--o{':
    'edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;strokeColor=#000000;fontSize=11;fontColor=#000000;startArrow=ERmandOne;startFill=0;endArrow=ERzeroToMany;endFill=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;',
  '||--o|':
    'edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;strokeColor=#000000;fontSize=11;fontColor=#000000;startArrow=ERmandOne;startFill=0;endArrow=ERzeroToOne;endFill=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;',
};

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function parseErd(source) {
  const body = source.slice(source.indexOf('erDiagram') + 'erDiagram'.length);
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);

  const relations = [];
  const entities = new Map();
  let current = null;

  for (const line of lines) {
    const rel = line.match(/^(\w+)\s+(\|\|--o\{|\|\|--o\|)\s+(\w+)\s*:\s*(.*)$/);
    if (rel) {
      relations.push({ from: rel[1], kind: rel[2], to: rel[3], label: rel[4].replace(/"/g, '').trim() });
      continue;
    }

    const open = line.match(/^(\w+)\s*\{$/);
    if (open) {
      current = open[1];
      if (!entities.has(current)) entities.set(current, []);
      continue;
    }

    if (line === '}') {
      current = null;
      continue;
    }

    if (current) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        entities.get(current).push({
          type: parts[0],
          name: parts[1],
          key: parts[2] ?? '',
        });
      }
    }
  }

  for (const rel of relations) {
    if (!entities.has(rel.from)) entities.set(rel.from, []);
    if (!entities.has(rel.to)) entities.set(rel.to, []);
  }

  return { relations, entities };
}

/** Xếp thực thể theo tầng: cha ở trên, con ở dưới, để đường quan hệ chỉ đi xuống. */
function assignLevels(names, relations) {
  const level = new Map(names.map((name) => [name, 0]));
  // Lặp đủ số thực thể là hội tụ, đồ thị ERD ở đây không có chu trình dài.
  for (let pass = 0; pass < names.length; pass += 1) {
    let moved = false;
    for (const rel of relations) {
      const next = level.get(rel.from) + 1;
      if (next > level.get(rel.to)) {
        level.set(rel.to, next);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return level;
}

function buildDrawio(name, { relations, entities }) {
  const names = [...entities.keys()];
  const level = assignLevels(names, relations);

  const byLevel = new Map();
  for (const entity of names) {
    const lv = level.get(entity);
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv).push(entity);
  }

  // Trong mỗi tầng, xếp con ngay dưới cha (trung bình vị trí cha) để đường ít cắt nhau.
  const orderIndex = new Map();
  const levelKeys = [...byLevel.keys()].sort((a, b) => a - b);
  for (const lv of levelKeys) {
    const row = byLevel.get(lv);
    if (lv > 0) {
      row.sort((a, b) => {
        const pos = (child) => {
          const parents = relations.filter((r) => r.to === child).map((r) => orderIndex.get(r.from) ?? 0);
          return parents.length ? parents.reduce((s, v) => s + v, 0) / parents.length : 0;
        };
        return pos(a) - pos(b);
      });
    }
    row.forEach((entity, index) => orderIndex.set(entity, index));
  }

  const geo = new Map();
  let y = 40;
  let maxX = 0;
  for (const lv of levelKeys) {
    const row = byLevel.get(lv);
    const rowWidth = row.length * ENTITY_W + (row.length - 1) * GAP_X;
    let x = 40;
    let tallest = 0;
    // Căn giữa từng tầng cho cân đối.
    const offset = Math.max(0, (maxRowWidth(byLevel, levelKeys) - rowWidth) / 2);
    for (const entity of row) {
      const attrs = entities.get(entity);
      const height = HEADER_H + Math.max(1, attrs.length) * ROW_H;
      geo.set(entity, { x: x + offset, y, w: ENTITY_W, h: height });
      maxX = Math.max(maxX, x + offset + ENTITY_W);
      tallest = Math.max(tallest, height);
      x += ENTITY_W + GAP_X;
    }
    y += tallest + GAP_Y;
  }

  const cells = [];
  for (const entity of names) {
    const box = geo.get(entity);
    const attrs = entities.get(entity);
    cells.push(
      `        <mxCell id="${esc(entity)}" value="${esc(entity)}" style="${ENTITY_STYLE}" vertex="1" parent="1">\n` +
      `          <mxGeometry x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" as="geometry" />\n` +
      `        </mxCell>`,
    );

    attrs.forEach((attr, index) => {
      const rowId = `${entity}-r${index}`;
      cells.push(
        `        <mxCell id="${esc(rowId)}" value="" style="${ROW_STYLE}" vertex="1" parent="${esc(entity)}">\n` +
        `          <mxGeometry y="${HEADER_H + index * ROW_H}" width="${ENTITY_W}" height="${ROW_H}" as="geometry" />\n` +
        `        </mxCell>`,
      );
      const label = `${attr.name}${attr.key ? `  (${attr.key})` : ''}  ·  ${attr.type}`;
      cells.push(
        `        <mxCell id="${esc(rowId)}-c" value="${esc(label)}" style="${CELL_STYLE}" vertex="1" parent="${esc(rowId)}">\n` +
        `          <mxGeometry width="${ENTITY_W}" height="${ROW_H}" as="geometry" />\n` +
        `        </mxCell>`,
      );
    });
  }

  relations.forEach((rel, index) => {
    cells.push(
      `        <mxCell id="rel${index}" value="${esc(rel.label)}" style="${REL_STYLE[rel.kind]}" edge="1" parent="1" source="${esc(rel.from)}" target="${esc(rel.to)}">\n` +
      `          <mxGeometry relative="1" as="geometry" />\n` +
      `        </mxCell>`,
    );
  });

  const pageWidth = maxX + 40;
  const pageHeight = y + 20;

  return `<mxfile host="app.diagrams.net" type="device">
  <diagram id="${esc(name)}" name="${esc(name)}">
    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${cells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

function maxRowWidth(byLevel, levelKeys) {
  let widest = 0;
  for (const lv of levelKeys) {
    const count = byLevel.get(lv).length;
    widest = Math.max(widest, count * ENTITY_W + (count - 1) * GAP_X);
  }
  return widest;
}

const files = readdirSync(DIR).filter((file) => file.endsWith('_erd.mmd')).sort();
let made = 0;
for (const file of files) {
  const source = readFileSync(join(DIR, file), 'utf8');
  const parsed = parseErd(source);
  const base = file.replace(/\.mmd$/, '');
  writeFileSync(join(DIR, `${base}.drawio`), buildDrawio(base, parsed), 'utf8');
  made += 1;
  console.log(
    `  ${base}: ${parsed.entities.size} thực thể, ${parsed.relations.length} quan hệ`,
  );
}
console.log(`Đã sinh ${made} file .drawio cho sơ đồ ERD`);
