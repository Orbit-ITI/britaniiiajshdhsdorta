// ============================================================
// server/index.js — Express + node:sqlite (Node 22+ built-in)
// ============================================================
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import serveStatic from 'serve-static';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const DATA_DIR   = join(ROOT, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db         = new DatabaseSync(join(DATA_DIR, 'empire.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'britempire_secret_change_in_prod';
const PORT       = parseInt(process.env.PORT || '3001');

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, nickname TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Citizen', city_id INTEGER, registration_date TEXT NOT NULL, passport TEXT DEFAULT NULL, properties TEXT NOT NULL DEFAULT '[]', businesses TEXT NOT NULL DEFAULT '[]', email TEXT);
  CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', user_id TEXT NOT NULL, user_nickname TEXT NOT NULL, city_id INTEGER NOT NULL DEFAULT 0, city_name TEXT NOT NULL DEFAULT '', data TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, review_note TEXT DEFAULT '', history TEXT NOT NULL DEFAULT '[]');
  CREATE TABLE IF NOT EXISTS cities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, governor_id TEXT, region TEXT, coordinates TEXT DEFAULT NULL);
  CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, date TEXT NOT NULL, author_id TEXT NOT NULL, author_nickname TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, message TEXT NOT NULL, app_id TEXT, read INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS passport_index (primary_id TEXT PRIMARY KEY);
  CREATE TABLE IF NOT EXISTS admin_logs (id TEXT PRIMARY KEY, admin_uid TEXT NOT NULL, admin_nickname TEXT NOT NULL, action TEXT NOT NULL, at TEXT NOT NULL, note TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS stats (key TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0);
  INSERT OR IGNORE INTO stats (key, value) VALUES ('citizens',0),('cities',0),('regions',0),('applications',0);
`);

// ─── Prepared statements ─────────────────────────────────────
const q = {
  userByNick:   db.prepare('SELECT * FROM users WHERE nickname = ?'),
  userByUid:    db.prepare('SELECT * FROM users WHERE uid = ?'),
  allUsers:     db.prepare('SELECT * FROM users'),
  insertUser:   db.prepare('INSERT INTO users (uid,nickname,password_hash,role,registration_date) VALUES (?,?,?,?,?)'),
  updateRole:   db.prepare('UPDATE users SET role=? WHERE uid=?'),
  updateCityU:  db.prepare('UPDATE users SET city_id=? WHERE uid=?'),
  setPassport:  db.prepare('UPDATE users SET passport=? WHERE uid=?'),
  setProps:     db.prepare('UPDATE users SET properties=? WHERE uid=?'),
  setBizs:      db.prepare('UPDATE users SET businesses=? WHERE uid=?'),
  appById:      db.prepare('SELECT * FROM applications WHERE id=?'),
  allApps:      db.prepare('SELECT * FROM applications ORDER BY created_at DESC'),
  appsByUser:   db.prepare('SELECT * FROM applications WHERE user_id=? ORDER BY created_at DESC'),
  insertApp:    db.prepare('INSERT INTO applications (id,type,status,user_id,user_nickname,city_id,city_name,data,created_at,updated_at,review_note,history) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'),
  updateApp:    db.prepare('UPDATE applications SET status=?,updated_at=?,review_note=?,history=? WHERE id=?'),
  cityById:     db.prepare('SELECT * FROM cities WHERE id=?'),
  allCities:    db.prepare('SELECT * FROM cities ORDER BY id ASC'),
  insertCity:   db.prepare('INSERT INTO cities (name,region,governor_id,coordinates) VALUES (?,?,?,?)'),
  updateCityG:  db.prepare('UPDATE cities SET governor_id=? WHERE id=?'),
  allNews:      db.prepare('SELECT * FROM news ORDER BY date DESC LIMIT 20'),
  insertNews:   db.prepare('INSERT INTO news (id,title,body,date,author_id,author_nickname) VALUES (?,?,?,?,?,?)'),
  newsById:     db.prepare('SELECT * FROM news WHERE id=?'),
  deleteNews:   db.prepare('DELETE FROM news WHERE id=?'),
  notifsByUser: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY at DESC'),
  insertNotif:  db.prepare('INSERT INTO notifications (id,user_id,message,app_id,read,at) VALUES (?,?,?,?,0,?)'),
  readAll:      db.prepare('UPDATE notifications SET read=1 WHERE user_id=?'),
  readOne:      db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?'),
  passExists:   db.prepare('SELECT primary_id FROM passport_index WHERE primary_id=?'),
  insertPass:   db.prepare('INSERT INTO passport_index (primary_id) VALUES (?)'),
  insertLog:    db.prepare('INSERT INTO admin_logs (id,admin_uid,admin_nickname,action,at,note) VALUES (?,?,?,?,?,?)'),
  allStats:     db.prepare('SELECT key,value FROM stats'),
  incStat:      db.prepare('UPDATE stats SET value=value+1 WHERE key=?'),
};

// ─── Helpers ─────────────────────────────────────────────────
const now  = () => new Date().toISOString();
const J    = (v) => { try { return JSON.parse(v); } catch { return null; } };
const LTRS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const rL   = () => LTRS[Math.floor(Math.random()*26)];
const rD   = (n) => Array.from({length:n},()=>Math.floor(Math.random()*10)).join('');

function genPassport() {
  for (let i=0;i<10;i++){
    const p=`${rL()}${rL()}${rD(5)}`;
    if (!q.passExists.get(p)){ q.insertPass.run(p); return{primaryId:p,secondaryId:`${rL()}${rL()}-${rD(4)}-${rD(5)}`}; }
  }
  throw new Error('Cannot generate unique passport ID');
}

const fmtUser = (r) => r ? ({ uid:r.uid, nickname:r.nickname, role:r.role, cityId:r.city_id??null, registrationDate:r.registration_date, passport:r.passport?J(r.passport):null, properties:J(r.properties)??[], businesses:J(r.businesses)??[], email:r.email??null }) : null;
const fmtApp  = (r) => r ? ({ id:r.id, type:r.type, status:r.status, userId:r.user_id, userNickname:r.user_nickname, cityId:r.city_id, cityName:r.city_name, data:J(r.data)??{}, createdAt:r.created_at, updatedAt:r.updated_at, reviewNote:r.review_note, history:J(r.history)??[] }) : null;
const fmtCity = (r) => r ? ({ id:r.id, name:r.name, governorId:r.governor_id??null, region:r.region??null, coordinates:r.coordinates?J(r.coordinates):null }) : null;

const GOV_ROLES = ['Emperor','GreatChancellor','SupremeMinister','Minister','ViceMinister','Governor','Official'];

function authMw(req,res,next){
  const h=req.headers.authorization;
  if(!h?.startsWith('Bearer ')) return res.status(401).json({message:'Не авторизован'});
  try{ req.user=jwt.verify(h.slice(7),JWT_SECRET); next(); }
  catch{ res.status(401).json({message:'Токен недействителен'}); }
}
function govMw(req,res,next){
  if(!GOV_ROLES.includes(req.user?.role)) return res.status(403).json({message:'Нет доступа'});
  next();
}

// ─── Express ─────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// AUTH
app.post('/api/auth/register',(req,res)=>{
  const{nickname,password}=req.body??{};
  if(!nickname||!password) return res.status(400).json({message:'Заполните все поля'});
  if(!/^[a-zA-Z0-9_]{3,16}$/.test(nickname)) return res.status(400).json({message:'Никнейм: 3–16 символов (a-z,0-9,_)'});
  if(password.length<6) return res.status(400).json({message:'Пароль минимум 6 символов'});
  if(q.userByNick.get(nickname)) return res.status(409).json({message:'Этот никнейм уже занят'});
  const uid=uuidv4(), hash=bcrypt.hashSync(password,10);
  q.insertUser.run(uid,nickname,hash,'Citizen',now());
  q.incStat.run('citizens');
  const token=jwt.sign({uid,nickname,role:'Citizen'},JWT_SECRET,{expiresIn:'30d'});
  res.json({token,profile:fmtUser(q.userByUid.get(uid))});
});

app.post('/api/auth/login',(req,res)=>{
  const{nickname,password}=req.body??{};
  if(!nickname||!password) return res.status(400).json({message:'Заполните все поля'});
  const row=q.userByNick.get(nickname);
  if(!row||!bcrypt.compareSync(password,row.password_hash)) return res.status(401).json({message:'Неверный никнейм или пароль'});
  const token=jwt.sign({uid:row.uid,nickname:row.nickname,role:row.role},JWT_SECRET,{expiresIn:'30d'});
  res.json({token,profile:fmtUser(row)});
});

app.get('/api/auth/me',authMw,(req,res)=>{
  const row=q.userByUid.get(req.user.uid);
  if(!row) return res.status(404).json({message:'Не найден'});
  res.json(fmtUser(row));
});

// USERS
app.get('/api/users',authMw,govMw,(req,res)=>res.json(q.allUsers.all().map(fmtUser)));
app.get('/api/users/:uid',authMw,(req,res)=>{
  const row=q.userByUid.get(req.params.uid);
  if(!row) return res.status(404).json({message:'Не найден'});
  res.json(fmtUser(row));
});
app.put('/api/users/:uid',authMw,govMw,(req,res)=>{
  const{role,cityId}=req.body??{};
  if(role) q.updateRole.run(role,req.params.uid);
  if(cityId!==undefined) q.updateCityU.run(cityId,req.params.uid);
  res.json(fmtUser(q.userByUid.get(req.params.uid)));
});

// APPLICATIONS
app.get('/api/applications',authMw,(req,res)=>{
  const{userId}=req.query;
  res.json((userId?q.appsByUser.all(userId):q.allApps.all()).map(fmtApp));
});

app.post('/api/applications',authMw,(req,res)=>{
  const{type,data}=req.body??{};
  if(!type||!data) return res.status(400).json({message:'Неверные данные'});
  const user=q.userByUid.get(req.user.uid);
  if(!user) return res.status(404).json({message:'Пользователь не найден'});
  const cityId=user.city_id||0;
  const city=cityId?q.cityById.get(cityId):null;
  const id=uuidv4(), ts=now();
  const history=JSON.stringify([{action:'submitted',byUid:user.uid,byNickname:user.nickname,at:ts}]);
  q.insertApp.run(id,type,'pending',user.uid,user.nickname,cityId,city?.name??'Неизвестно',JSON.stringify(data),ts,ts,'',history);
  q.incStat.run('applications');
  if(city?.governor_id) q.insertNotif.run(uuidv4(),city.governor_id,`Новая заявка от ${user.nickname}: ${type}`,id,ts);
  res.json(fmtApp(q.appById.get(id)));
});

app.put('/api/applications/:id',authMw,govMw,(req,res)=>{
  const{status,note=''}=req.body??{};
  const appRow=q.appById.get(req.params.id);
  if(!appRow) return res.status(404).json({message:'Заявка не найдена'});
  const ts=now(), prev=fmtApp(appRow);
  const history=JSON.stringify([...(prev.history??[]),{action:status,byUid:req.user.uid,byNickname:req.user.nickname,at:ts,note}]);
  q.updateApp.run(status,ts,note,history,req.params.id);
  const lbl={approved:'Одобрено',rejected:'Отклонено',review:'На пересмотре'}[status]??status;
  q.insertNotif.run(uuidv4(),appRow.user_id,`Ваша заявка "${appRow.type}" — ${lbl}`,req.params.id,ts);
  const d=J(appRow.data)??{};
  if(status==='approved'&&appRow.type==='passport'){
    const{primaryId,secondaryId}=genPassport();
    q.setPassport.run(JSON.stringify({primaryId,secondaryId,firstName:d.firstName,lastName:d.lastName,issuedAt:ts,cityId:appRow.city_id}),appRow.user_id);
  }
  if(status==='approved'&&appRow.type==='property'){
    const u=q.userByUid.get(appRow.user_id); const props=J(u?.properties)??[];
    props.push({id:req.params.id,type:d.type,coordinates:d.coordinates,description:d.description,approvedAt:ts});
    q.setProps.run(JSON.stringify(props),appRow.user_id);
  }
  if(status==='approved'&&appRow.type==='organization'){
    const u=q.userByUid.get(appRow.user_id); const bizs=J(u?.businesses)??[];
    bizs.push({id:req.params.id,name:d.name,officePropertyId:d.officeAddress,description:d.description,registeredAt:ts});
    q.setBizs.run(JSON.stringify(bizs),appRow.user_id);
  }
  q.insertLog.run(uuidv4(),req.user.uid,req.user.nickname,`${status} application ${req.params.id}`,ts,note);
  res.json(fmtApp(q.appById.get(req.params.id)));
});

// CITIES
app.get('/api/cities',(req,res)=>res.json(q.allCities.all().map(fmtCity)));
app.post('/api/cities',authMw,govMw,(req,res)=>{
  const{name,region,governorId,coordinates}=req.body??{};
  if(!name) return res.status(400).json({message:'Укажите название'});
  const r=q.insertCity.run(name,region??null,governorId??null,coordinates?JSON.stringify(coordinates):null);
  q.incStat.run('cities');
  res.json(fmtCity(q.cityById.get(r.lastInsertRowid)));
});
app.put('/api/cities/:id',authMw,govMw,(req,res)=>{
  const{governorId}=req.body??{};
  if(governorId!==undefined) q.updateCityG.run(governorId,req.params.id);
  res.json(fmtCity(q.cityById.get(req.params.id)));
});

// NEWS
app.get('/api/news',(req,res)=>res.json(q.allNews.all()));
app.post('/api/news',authMw,govMw,(req,res)=>{
  const{title,body}=req.body??{};
  if(!title||!body) return res.status(400).json({message:'Заполните заголовок и текст'});
  const id=uuidv4(); q.insertNews.run(id,title,body,now(),req.user.uid,req.user.nickname);
  res.json(q.newsById.get(id));
});
app.delete('/api/news/:id',authMw,govMw,(req,res)=>{ q.deleteNews.run(req.params.id); res.json({ok:true}); });

// STATS
app.get('/api/stats',(req,res)=>res.json(Object.fromEntries(q.allStats.all().map(r=>[r.key,r.value]))));

// NOTIFICATIONS
app.get('/api/notifications/:uid',authMw,(req,res)=>{
  if(req.user.uid!==req.params.uid) return res.status(403).json({message:'Нет доступа'});
  res.json(q.notifsByUser.all(req.params.uid).map(r=>({...r,read:!!r.read})));
});
app.put('/api/notifications/:uid/read-all',authMw,(req,res)=>{
  if(req.user.uid!==req.params.uid) return res.status(403).json({message:'Нет доступа'});
  q.readAll.run(req.params.uid); res.json({ok:true});
});
app.put('/api/notifications/:uid/:id/read',authMw,(req,res)=>{
  q.readOne.run(req.params.id,req.params.uid); res.json({ok:true});
});

// DELETE single application
app.delete('/api/applications/:id', authMw, govMw, (req, res) => {
  const appRow = q.appById.get(req.params.id);
  if (!appRow) return res.status(404).json({ message: 'Заявка не найдена' });
  db.prepare('DELETE FROM applications WHERE id=?').run(req.params.id);
  q.insertLog.run(uuidv4(), req.user.uid, req.user.nickname,
    `deleted application ${req.params.id}`, now(), '');
  res.json({ ok: true });
});

// DELETE all applications of a user + clear passport/properties/businesses
app.delete('/api/users/:uid/data', authMw, govMw, (req, res) => {
  const target = q.userByUid.get(req.params.uid);
  if (!target) return res.status(404).json({ message: 'Пользователь не найден' });

  // Delete all their applications
  const apps = q.appsByUser.all(req.params.uid);
  const delApp = db.prepare('DELETE FROM applications WHERE id=?');
  for (const a of apps) delApp.run(a.id);

  // Delete their notifications
  db.prepare('DELETE FROM notifications WHERE user_id=?').run(req.params.uid);

  // Clear profile data
  q.setPassport.run(null, req.params.uid);
  q.setProps.run('[]', req.params.uid);
  q.setBizs.run('[]', req.params.uid);

  // Remove passport IDs from index (so they can be re-issued)
  if (target.passport) {
    const p = J(target.passport);
    if (p?.primaryId) {
      db.prepare('DELETE FROM passport_index WHERE primary_id=?').run(p.primaryId);
    }
  }

  q.insertLog.run(uuidv4(), req.user.uid, req.user.nickname,
    `cleared all data for user ${target.nickname}`, now(), '');

  res.json({ ok: true, deletedApps: apps.length });
});

// DELETE user entirely (ban)
app.delete('/api/users/:uid', authMw, govMw, (req, res) => {
  // Only Emperor can delete users
  if (req.user.role !== 'Emperor')
    return res.status(403).json({ message: 'Только Император может удалять игроков' });

  const target = q.userByUid.get(req.params.uid);
  if (!target) return res.status(404).json({ message: 'Не найден' });

  db.prepare('DELETE FROM applications WHERE user_id=?').run(req.params.uid);
  db.prepare('DELETE FROM notifications WHERE user_id=?').run(req.params.uid);
  db.prepare('DELETE FROM users WHERE uid=?').run(req.params.uid);
  db.prepare("UPDATE stats SET value=MAX(0,value-1) WHERE key='citizens'").run();

  q.insertLog.run(uuidv4(), req.user.uid, req.user.nickname,
    `deleted user ${target.nickname}`, now(), '');

  res.json({ ok: true });
});

// Serve React frontend (production)
const distPath=resolve(ROOT,'dist');
if(existsSync(distPath)){
  app.use(serveStatic(distPath));
  app.get('*',(req,res)=>{ if(!req.path.startsWith('/api')) res.sendFile(resolve(distPath,'index.html')); });
}

app.listen(PORT,()=>{
  console.log(`\n🏰  Британская Империя — Сервер запущен`);
  console.log(`    http://localhost:${PORT}`);
  console.log(`    База данных: ${join(DATA_DIR,'empire.db')}\n`);
});
