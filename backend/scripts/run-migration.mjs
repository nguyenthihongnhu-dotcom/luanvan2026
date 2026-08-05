// Chạy một file .sql migration bằng driver mysql2 sẵn có, dùng DATABASE_URL trong .env.
// Dùng script này thay cho lệnh `mysql` khi máy không cài MySQL client vào PATH.
//
//   node scripts/run-migration.mjs migrations/2026-08-05_zone_grid_layout.sql
//
// Chạy lại nhiều lần vẫn an toàn: các lỗi kiểu "cột đã tồn tại" được bỏ qua
// và báo là đã áp dụng từ trước.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

const ALREADY_APPLIED = new Set([
  'ER_DUP_FIELDNAME', // cột đã tồn tại
  'ER_DUP_KEYNAME', // index đã tồn tại
  'ER_TABLE_EXISTS_ERROR',
  'ER_DUP_ENTRY',
]);

const file = process.argv[2];

if (!file) {
  console.error('Thiếu đường dẫn file .sql.');
  console.error('Ví dụ: node scripts/run-migration.mjs migrations/2026-08-05_zone_grid_layout.sql');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Không đọc được DATABASE_URL. Kiểm tra file backend/.env.');
  process.exit(1);
}

const path = resolve(process.cwd(), file);
const raw = readFileSync(path, 'utf8');

// Bỏ dòng chú thích rồi tách câu lệnh theo dấu chấm phẩy.
const statements = raw
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

if (statements.length === 0) {
  console.error(`File ${file} không có câu lệnh SQL nào.`);
  process.exit(1);
}

const connection = await mysql.createConnection(databaseUrl);
const dbName = connection.config.database;
console.log(`Kết nối CSDL: ${dbName}`);
console.log(`Chạy ${statements.length} câu lệnh từ ${file}\n`);

let applied = 0;
let skipped = 0;

try {
  for (const [index, statement] of statements.entries()) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 90);
    try {
      await connection.query(statement);
      applied += 1;
      console.log(`  [${index + 1}] OK      ${preview}`);
    } catch (error) {
      if (ALREADY_APPLIED.has(error.code)) {
        skipped += 1;
        console.log(`  [${index + 1}] Bỏ qua  ${preview}`);
        console.log(`           (${error.code}: đã áp dụng từ trước)`);
        continue;
      }
      console.error(`  [${index + 1}] LỖI     ${preview}`);
      console.error(`           ${error.code}: ${error.message}`);
      throw error;
    }
  }

  console.log(`\nHoàn tất: ${applied} câu lệnh đã chạy, ${skipped} câu bỏ qua vì đã có sẵn.`);
} finally {
  await connection.end();
}
