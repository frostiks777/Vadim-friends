# Документация базы данных

Подробное описание схемы базы данных, модели данных и операций.

---

## Обзор

Проект использует **SQLite** — лёгкую файловую СУБД, не требующую отдельного сервера. Для взаимодействия с БД применяется **Prisma ORM** — типобезопасный ORM для Node.js/TypeScript.

### Почему SQLite?

| Преимущество | Описание |
|-------------|---------|
| Простота | Не требует установки и настройки сервера БД |
| Файловое хранение | Вся база хранится в одном файле `db/custom.db` |
| Нулевая конфигурация | Достаточно указать путь к файлу в `.env` |
| Идеально для обучения | Легко понять и отлаживать |
| Прозрачность | Базу можно открыть любым SQLite-клиентом |

---

## Подключение

### Строка подключения

Файл `.env`:

```env
DATABASE_URL=file:./db/custom.db
```

Формат для SQLite в Prisma: `file:<путь-от-корня-проекта>`

### Prisma Client

Подключение реализовано через singleton-паттерн в `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],  // Логирование SQL-запросов в консоль
  })

// Предотвращение создания нескольких экземпляров при hot-reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Ключевые моменты:**
- Singleton — один экземпляр PrismaClient на всё приложение
- Global-кэширование — предотвращает создание лишних соединений при hot-reload в разработке
- Логирование запросов — все SQL-запросы выводятся в консоль (`log: ['query']`)

---

## Схема базы данных

Файл: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Item {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Модель Item

### Описание

Модель `Item` представляет собой запись в системе управления данными. Каждая запись имеет уникальный идентификатор, название (обязательное поле), описание (необязательное) и временные метки.

### Поля

| Поле | Тип БД | Тип TypeScript | Ограничения | По умолчанию | Описание |
|------|--------|---------------|------------|-------------|---------|
| `id` | `INTEGER` | `number` | PRIMARY KEY, AUTOINCREMENT | Автоинкремент | Уникальный идентификатор |
| `name` | `TEXT` | `string` | NOT NULL | — | Название записи |
| `description` | `TEXT` | `string \| null` | NULLABLE | `null` | Описание записи |
| `createdAt` | `DATETIME` | `Date` (string в JSON) | NOT NULL | `now()` | Дата и время создания |
| `updatedAt` | `DATETIME` | `Date` (string в JSON) | NOT NULL | `now()` + автообновление | Дата и время последнего обновления |

### Атрибуты Prisma

| Поле | Атрибуты | Пояснение |
|------|---------|----------|
| `id` | `@id @default(autoincrement())` | Автоматический счётчик, является первичным ключом |
| `name` | (без атрибутов) | Обязательное строковое поле |
| `description` | (без атрибутов, тип `String?`) | Необязательное поле (`?` указывает на nullable) |
| `createdAt` | `@default(now())` | Автоматически устанавливается при создании |
| `updatedAt` | `@updatedAt` | Автоматически обновляется при каждом изменении записи |

### Ограничения

- **`name`** — не может быть `NULL`. Валидация на уровне API дополнительно проверяет, что строка не пустая и не состоит только из пробелов
- **`description`** — может быть `NULL` или пустой строкой
- **`id`** — уникален, генерируется автоматически

---

## SQL-представление

Prisma генерирует следующий SQL для создания таблицы:

```sql
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

---

## Операции с базой данных

### 1. Создание записи (Create)

```typescript
await db.item.create({
  data: {
    name: "Название записи",
    description: "Описание записи",  // или null
  },
})
```

**Генерируемый SQL:**
```sql
INSERT INTO "Item" ("name", "description", "createdAt", "updatedAt")
VALUES ('Название записи', 'Описание записи', '2025-01-15 12:00:00', '2025-01-15 12:00:00');
```

### 2. Чтение всех записей (Read)

```typescript
await db.item.findMany({
  orderBy: { id: 'desc' },
})
```

**Генерируемый SQL:**
```sql
SELECT * FROM "Item" ORDER BY "id" DESC;
```

### 3. Чтение одной записи (Read by ID)

```typescript
await db.item.findUnique({
  where: { id: 1 },
})
```

**Генерируемый SQL:**
```sql
SELECT * FROM "Item" WHERE "id" = 1;
```

### 4. Подсчёт записей (Count)

```typescript
await db.item.count()
```

**Генерируемый SQL:**
```sql
SELECT COUNT(*) FROM "Item";
```

### 5. Обновление записи (Update)

```typescript
await db.item.update({
  where: { id: 1 },
  data: {
    name: "Новое название",
    description: "Новое описание",
  },
})
```

**Генерируемый SQL:**
```sql
UPDATE "Item" SET "name" = 'Новое название', "description" = 'Новое описание', "updatedAt" = '2025-01-15 13:00:00'
WHERE "id" = 1;
```

### 6. Удаление записи (Delete)

```typescript
await db.item.delete({
  where: { id: 1 },
})
```

**Генерируемый SQL:**
```sql
DELETE FROM "Item" WHERE "id" = 1;
```

### 7. Массовое создание (CreateMany)

Используется для начального заполнения БД (seed):

```typescript
await db.item.createMany({
  data: [
    { name: "Запись 1", description: "Описание 1" },
    { name: "Запись 2", description: "Описание 2" },
  ],
})
```

**Генерируемый SQL:**
```sql
INSERT INTO "Item" ("name", "description", "createdAt", "updatedAt") VALUES
  ('Запись 1', 'Описание 1', '2025-01-15 12:00:00', '2025-01-15 12:00:00'),
  ('Запись 2', 'Описание 2', '2025-01-15 12:00:00', '2025-01-15 12:00:00');
```

---

## Скрипты управления БД

Все скрипты определены в `package.json`:

### `bun run db:push`

Применяет схему Prisma к базе данных без создания миграций. Подходит для разработки.

```bash
bun run db:push
```

**Что происходит:**
1. Prisma читает `prisma/schema.prisma`
2. Сравнивает схему с текущим состоянием БД
3. Создаёт или изменяет таблицы по необходимости
4. Генерирует Prisma Client (`node_modules/@prisma/client`)

### `bun run db:generate`

Генерирует Prisma Client из схемы. Выполняется автоматически при `db:push`.

```bash
bun run db:generate
```

### `bun run db:migrate`

Создаёт и применяет миграцию базы данных. Подходит для production.

```bash
bun run db:migrate
```

### `bun run db:reset`

Сбрасывает базу данных: удаляет все данные и применяет схему заново.

```bash
bun run db:reset
```

---

## Начальные данные (Seed)

Начальные данные добавляются через API-эндпоинт `POST /api/items/seed` или вручную.

Реализация: `src/app/api/items/seed/route.ts`

### Начальные записи

| ID | Название | Описание |
|----|---------|---------|
| 1 | Изучение Next.js | Полный курс по фреймворку Next.js с App Router, Server Components и API Routes. |
| 2 | Работа с базой данных | Подключение SQLite через Prisma ORM. Выполнение CRUD-операций. |
| 3 | Проектирование интерфейса | Создание адаптивного интерфейса с помощью Tailwind CSS и shadcn/ui. |
| 4 | Деплой приложения | Развёртывание production-версии на сервере с настройкой окружения. |

### Логика заполнения

1. Проверяется количество записей в таблице (`db.item.count()`)
2. Если таблица **пуста** — добавляются 4 начальные записи
3. Если записи **уже существуют** — операция пропускается с информационным сообщением

---

## Файлы БД

```
db/
└── custom.db          # Файл базы данных SQLite (бинарный)
```

### Инспекция БД

Для просмотра содержимого БД можно использовать инструменты:

```bash
# SQLite CLI
sqlite3 db/custom.db "SELECT * FROM Item;"

# Prisma Studio (веб-интерфейс)
npx prisma studio
```

---

## Архитектура доступа к данным

```
┌───────────────────────┐
│   Клиент (Browser)    │
│   fetch('/api/items') │
└───────────┬───────────┘
            │ HTTP (JSON)
┌───────────▼───────────┐
│   API Route Handler   │
│   src/app/api/items/  │
│   route.ts            │
└───────────┬───────────┘
            │ Prisma Client
┌───────────▼───────────┐
│   Prisma ORM          │
│   (сгенерированный    │
│    код из schema)     │
└───────────┬───────────┘
            │ SQLite3 драйвер
┌───────────▼───────────┐
│   SQLite Database     │
│   db/custom.db        │
└───────────────────────┘
```

**Важное правило:** Prisma Client используется **только на сервере** (в API Routes). Клиентская часть (`page.tsx`) никогда не импортирует Prisma напрямую — все операции выполняются через HTTP-запросы к API.
