#!/usr/bin/env node
// ============================================================
// setup.js — First-time setup: create admin, add cities
// Usage: node --experimental-sqlite setup.js
// ============================================================
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, 'empire.db'));

// Ensure tables exist (mirror server schema)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, nickname TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Citizen', city_id INTEGER, registration_date TEXT NOT NULL, passport TEXT DEFAULT NULL, properties TEXT NOT NULL DEFAULT '[]', businesses TEXT NOT NULL DEFAULT '[]', email TEXT);
  CREATE TABLE IF NOT EXISTS cities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, governor_id TEXT, region TEXT, coordinates TEXT DEFAULT NULL);
  CREATE TABLE IF NOT EXISTS stats (key TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0);
  INSERT OR IGNORE INTO stats (key,value) VALUES ('citizens',0),('cities',0),('regions',0),('applications',0);
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

const c = {
  green:  (t) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan:   (t) => `\x1b[36m${t}\x1b[0m`,
  bold:   (t) => `\x1b[1m${t}\x1b[0m`,
};

console.log();
console.log(c.bold('  🏰  Британская Империя — Первоначальная настройка'));
console.log(c.cyan('  ─────────────────────────────────────────────────'));
console.log();

async function menu() {
  while (true) {
    console.log(c.yellow('  Выберите действие:'));
    console.log('  1. Создать администратора (Императора)');
    console.log('  2. Повысить роль существующего пользователя');
    console.log('  3. Добавить город');
    console.log('  4. Показать всех пользователей');
    console.log('  5. Показать все города');
    console.log('  6. Выход');
    console.log();

    const choice = (await ask('  > ')).trim();
    console.log();

    if (choice === '1') {
      const nickname = (await ask('  Никнейм: ')).trim();
      const password = (await ask('  Пароль:  ')).trim();

      if (!nickname || !password) { console.log(c.yellow('  ⚠ Заполните оба поля\n')); continue; }
      if (db.prepare('SELECT uid FROM users WHERE nickname=?').get(nickname)) {
        console.log(c.yellow('  ⚠ Такой никнейм уже существует. Используйте пункт 2 для повышения роли.\n'));
        continue;
      }

      const uid  = uuidv4();
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('INSERT INTO users (uid,nickname,password_hash,role,registration_date) VALUES (?,?,?,?,?)').run(uid, nickname, hash, 'Emperor', new Date().toISOString());
      db.prepare("UPDATE stats SET value=value+1 WHERE key='citizens'").run();
      console.log(c.green(`  ✓ Администратор "${nickname}" создан с ролью Император\n`));

    } else if (choice === '2') {
      const users = db.prepare('SELECT uid,nickname,role FROM users').all();
      if (users.length === 0) { console.log(c.yellow('  Пользователей пока нет\n')); continue; }
      console.log('  Пользователи:');
      users.forEach((u, i) => console.log(`  ${i+1}. ${u.nickname} (${u.role})`));
      const num = parseInt((await ask('\n  Номер пользователя: ')).trim());
      const target = users[num - 1];
      if (!target) { console.log(c.yellow('  ⚠ Неверный номер\n')); continue; }

      const roles = ['Emperor','GreatChancellor','SupremeMinister','Minister','ViceMinister','Governor','Official','Citizen'];
      console.log('\n  Роли:');
      roles.forEach((r, i) => console.log(`  ${i+1}. ${r}`));
      const rnum = parseInt((await ask('\n  Номер роли: ')).trim());
      const role = roles[rnum - 1];
      if (!role) { console.log(c.yellow('  ⚠ Неверный номер\n')); continue; }

      db.prepare('UPDATE users SET role=? WHERE uid=?').run(role, target.uid);
      console.log(c.green(`  ✓ Роль "${target.nickname}" изменена на ${role}\n`));

    } else if (choice === '3') {
      const name   = (await ask('  Название города: ')).trim();
      const region = (await ask('  Регион (Enter — пропустить): ')).trim();
      if (!name) { console.log(c.yellow('  ⚠ Введите название\n')); continue; }
      const r = db.prepare('INSERT INTO cities (name,region) VALUES (?,?)').run(name, region || null);
      db.prepare("UPDATE stats SET value=value+1 WHERE key='cities'").run();
      console.log(c.green(`  ✓ Город "${name}" добавлен с ID=${r.lastInsertRowid}`));
      console.log(c.cyan(`    Чтобы назначить губернатора, запустите пункт 2 и установите городской ID в панели управления\n`));

    } else if (choice === '4') {
      const users = db.prepare('SELECT nickname,role,city_id,registration_date FROM users').all();
      if (users.length === 0) { console.log('  Пользователей нет\n'); continue; }
      console.log('  Никнейм            | Роль                   | Город');
      console.log('  ' + '─'.repeat(56));
      users.forEach(u => {
        const n = u.nickname.padEnd(18);
        const r = u.role.padEnd(22);
        console.log(`  ${n} | ${r} | ${u.city_id ?? '—'}`);
      });
      console.log();

    } else if (choice === '5') {
      const cities = db.prepare('SELECT * FROM cities').all();
      if (cities.length === 0) { console.log('  Городов нет\n'); continue; }
      cities.forEach(c2 => console.log(`  [${c2.id}] ${c2.name} | Регион: ${c2.region ?? '—'} | Губернатор: ${c2.governor_id ?? '—'}`));
      console.log();

    } else if (choice === '6') {
      break;
    } else {
      console.log(c.yellow('  ⚠ Неверный выбор\n'));
    }
  }

  rl.close();
  db.close();
  console.log('\n  До свидания! 👋\n');
}

menu().catch(e => { console.error(e); process.exit(1); });
