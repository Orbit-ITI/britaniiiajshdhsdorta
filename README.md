# 🏰 Британская Империя — Государственный Портал v2.0

**Стек:** React + Vite + Express + SQLite (Node 22 built-in) + Cloudflare Tunnel

---

## ⚡ Быстрый старт

### Требования
- Node.js **22+** (`node --version` должен показать `v22.x`)
- Python 3.8+ (для туннеля)
- npm

### 1. Установить зависимости
```bash
npm install
```

### 2. Первоначальная настройка (создать администратора)
```bash
npm run setup
# или: node --experimental-sqlite setup.js
```
Интерактивное меню позволяет:
- Создать Императора (первый администратор)
- Добавить города
- Повысить роль любому пользователю

### 3. Запустить сайт + Cloudflare Tunnel
```bash
python start.py
```

Скрипт автоматически:
1. Собирает фронтенд (`npm run build`)
2. Скачивает `cloudflared.exe` если его нет
3. Запускает Express сервер на порту 3001
4. Открывает туннель → выводит ваш `https://xxxx.trycloudflare.com`

---

## 🛠️ Ручной запуск (без туннеля)

```bash
# Терминал 1 — фронтенд (dev mode)
npm run dev

# Терминал 2 — сервер
npm run server

# Открыть http://localhost:5173
```

Или production (один процесс):
```bash
npm run build
npm run start
# Открыть http://localhost:3001
```

---

## 👑 Первый вход

1. Запустите `npm run setup` → **"1. Создать администратора"**
2. Введите никнейм и пароль
3. Войдите на портале → в шапке появится кнопка **"Управление"**

---

## 📋 Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Vite dev server (фронт) |
| `npm run build` | Собрать фронтенд в `dist/` |
| `npm run server` | Запустить Express + SQLite сервер |
| `npm run setup` | Интерактивная настройка БД |
| `python start.py` | Всё в одном + cloudflared |
| `python start.py --no-build` | Без пересборки фронта |
| `python start.py --dev` | Dev режим (vite + node параллельно) |

---

## 🏗️ Архитектура

```
portal/
├── server/
│   └── index.js          ← Express REST API + SQLite
├── setup.js              ← CLI настройка БД
├── start.py              ← Cloudflare Tunnel launcher
├── src/
│   ├── app/
│   │   ├── App.tsx       ← Роутер
│   │   └── components/
│   │       ├── admin/    ← Панель управления
│   │       └── services/ ← 5 форм услуг
│   ├── context/
│   │   └── AuthContext.tsx ← JWT авторизация
│   ├── hooks/
│   │   └── usePolling.ts   ← Polling вместо Firebase onValue
│   └── lib/
│       ├── api.ts        ← REST клиент (fetch + JWT)
│       └── types.ts      ← TypeScript типы
└── data/
    └── empire.db         ← SQLite база данных (создаётся автоматически)
```

---

## 🌐 API эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход |
| `GET`  | `/api/auth/me` | Текущий профиль |
| `GET`  | `/api/users` | Все пользователи (gov) |
| `PUT`  | `/api/users/:uid` | Изменить роль/город (gov) |
| `GET`  | `/api/applications` | Все заявки |
| `POST` | `/api/applications` | Подать заявку |
| `PUT`  | `/api/applications/:id` | Принять решение (gov) |
| `GET`  | `/api/cities` | Список городов |
| `POST` | `/api/cities` | Добавить город (gov) |
| `GET`  | `/api/news` | Новости |
| `POST` | `/api/news` | Добавить новость (gov) |
| `GET`  | `/api/stats` | Статистика |
| `GET`  | `/api/notifications/:uid` | Уведомления |

---

## 🗺️ Подключить карту сервера (Dynmap)

В файле `src/app/components/Map.tsx` найдите placeholder и замените:
```tsx
<iframe
  src="http://ВАШ-IP:8123"
  className="w-full h-full border-0"
  title="Карта"
/>
```

---

## 💾 База данных

SQLite файл: `data/empire.db`

Таблицы: `users`, `applications`, `cities`, `news`, `notifications`, `stats`, `passport_index`, `admin_logs`

Для просмотра/редактирования: [DB Browser for SQLite](https://sqlitebrowser.org/) (бесплатно)

---

## 🔑 Переменные окружения

```bash
PORT=3001              # Порт сервера (по умолчанию 3001)
JWT_SECRET=my_secret   # Секрет для JWT (замените в production!)
```
