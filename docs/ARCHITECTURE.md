# Архитектура проекта

Подробное описание архитектурных решений, структуры приложения и взаимодействия компонентов.

---

## Обзор

Проект реализован по принципу **монолитного веб-приложения** с разделением на серверную и клиентскую части в рамках единого Next.js-приложения. Архитектура следует паттерну **Server-Client separation** в рамках App Router.

---

## Архитектурные слои

```
┌─────────────────────────────────────────────────────────────┐
│                    ПРОСМОТР (BROWSER)                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Client Components                  │    │
│  │  page.tsx ('use client')                             │    │
│  │                                                      │    │
│  │  • Состояние (useState)                              │    │
│  │  • Сайд-эффекты (useEffect)                          │    │
│  │  • Обработчики событий                               │    │
│  │  • UI-рендеринг (shadcn/ui + Tailwind)               │    │
│  │  • Анимации (Framer Motion)                          │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │ fetch()                           │
│                         │ HTTP / JSON                       │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    СЕРВЕР (NODE.JS / BUN)                   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │              Next.js App Router                      │    │
│  │                                                      │    │
│  │  ┌────────────────┐  ┌───────────────────────────┐  │    │
│  │  │  Server Layer   │  │  Route Handlers (API)     │  │    │
│  │  │                  │  │                           │  │    │
│  │  │ • layout.tsx    │  │ • GET /api/items           │  │    │
│  │  │   (metadata,    │  │ • POST /api/items          │  │    │
│  │  │    fonts)       │  │ • PUT /api/items/[id]     │  │    │
│  │  │                  │  │ • DELETE /api/items/[id]  │  │    │
│  │  │ • globals.css   │  │ • POST /api/items/seed    │  │    │
│  │  │   (styles)      │  │                           │  │    │
│  │  └────────────────┘  └──────────┬────────────────┘  │    │
│  └─────────────────────────────────┼───────────────────┘    │
│                                    │                         │
│  ┌─────────────────────────────────▼───────────────────┐    │
│  │              Prisma ORM Layer                        │    │
│  │                                                      │    │
│  │  src/lib/db.ts → PrismaClient singleton              │    │
│  │                                                      │    │
│  │  • findMany()   • findUnique()   • create()          │    │
│  │  • update()     • delete()       • count()           │    │
│  │  • createMany()                                     │    │
│  └─────────────────────────────────┬───────────────────┘    │
│                                    │                         │
│  ┌─────────────────────────────────▼───────────────────┐    │
│  │              SQLite Database                         │    │
│  │                                                      │    │
│  │  db/custom.db → таблица Item                         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    CADDY (REVERSE PROXY)                    │
│                                                             │
│  :81 → localhost:3000 (Next.js)                             │
│  XTransformPort → маршрутизация к другим сервисам           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Принцип Server-Client разделения

### Серверная часть (Server-side)

Компоненты и файлы, которые выполняются **только на сервере**:

| Файл | Роль |
|------|------|
| `src/app/layout.tsx` | Корневой layout — определяет HTML-структуру, метаданные, шрифты |
| `src/app/globals.css` | Глобальные стили — обрабатываются PostCSS/Tailwind |
| `src/app/api/*/route.ts` | API Route Handlers — обработка HTTP-запросов |
| `src/lib/db.ts` | Prisma Client — доступ к базе данных |

**Правило:** Prisma Client и прямой доступ к БД доступны только в серверном коде.

### Клиентская часть (Client-side)

Компоненты с директивой `'use client'`, которые выполняются **в браузере**:

| Файл | Роль |
|------|------|
| `src/app/page.tsx` | Главная страница — интерактивный CRUD-интерфейс |

**Правило:** Клиент не имеет прямого доступа к БД. Все операции выполняются через HTTP-запросы к API.

---

## Маршрутизация

### Next.js App Router

Проект использует единственный маршрут — корневой (`/`):

```
src/app/
├── layout.tsx       ← Корневой layout (Server Component)
├── page.tsx         ← Главная страница (Client Component)
├── globals.css      ← Глобальные стили
└── api/
    ├── route.ts     ← GET /api
    └── items/
        ├── route.ts ← GET/POST /api/items
        ├── [id]/
        │   └── route.ts ← PUT/DELETE /api/items/[id]
        └── seed/
            └── route.ts ← POST /api/items/seed
```

### API Route Handlers

API-роуты используют стандартный формат **Next.js Route Handlers** (функции `GET`, `POST`, `PUT`, `DELETE`, экспортируемые из `route.ts`).

**Динамические параметры** (например, `[id]`) в Next.js 16 передаются как `Promise`:

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // обязательно await
  // ...
}
```

---

## Управление состоянием

### Состояние на клиенте

Всякое состояние в `page.tsx` управляется через React hooks:

| Состояние | Тип | Назначение |
|----------|-----|-----------|
| `items` | `Item[]` | Список записей из БД |
| `loading` | `boolean` | Состояние загрузки |
| `newName` | `string` | Значение поля «Название» в форме |
| `newDescription` | `string` | Значение поля «Описание» в форме |
| `submitting` | `boolean` | Состояние отправки формы |
| `editingItem` | `Item \| null` | Текущая редактируемая запись |
| `editName` | `string` | Значение поля в диалоге редактирования |
| `editDescription` | `string` | Значение поля в диалоге редактирования |
| `editDialogOpen` | `boolean` | Состояние открытости диалога |
| `updating` | `boolean` | Состояние обновления записи |
| `seeding` | `boolean` | Состояние заполнения БД |

### Состояние на сервере

Серверное состояние — это база данных SQLite. Нет кэширования уровня приложения; каждый запрос к API выполняет реальный SQL-запрос.

---

## Обработка данных

### Поток данных при чтении (Read)

```
1. Компонент монтируется → useEffect → fetchItems()
2. fetch('/api/items') → HTTP GET
3. API Route Handler → db.item.findMany()
4. Prisma → SQL: SELECT * FROM Item ORDER BY id DESC
5. SQLite → возвращает строки
6. Prisma → трансформирует в TypeScript-объекты
7. API → JSON-ответ
8. Компонент → setItems(data) → перерисовка
```

### Поток данных при создании (Create)

```
1. Пользователь заполняет форму → клик «Добавить»
2. Валидация (name не пустой)
3. fetch('/api/items', { method: 'POST', body: JSON })
4. API Route Handler → валидация → db.item.create()
5. Prisma → SQL: INSERT INTO Item ...
6. SQLite → создаёт запись
7. API → JSON-ответ (201)
8. Компонент → fetchItems() → обновление списка
```

---

## Статические vs Динамические данные

### Статические данные (из кода)

Определены как константы внутри `page.tsx`:

```typescript
// Возможности проекта (6 карточек)
const STATIC_FEATURES: StaticFeature[] = [
  { id: 1, icon: <LayoutDashboard />, title: '...', description: '...', tags: ['...'] },
  // ...
]

// Технологический стек (8 технологий)
const STATIC_TECH_STACK = [
  { name: 'Next.js 16', category: 'Фреймворк' },
  // ...
]
```

**Характеристики:**
- Не изменяются при работе приложения
- Рендерятся всегда, независимо от БД
- Могут быть изменены только через редактирование исходного кода

### Динамические данные (из БД)

Хранятся в таблице `Item` базы данных SQLite:

```
API Request → Route Handler → Prisma → SQLite → Response → UI
```

**Характеристики:**
- Изменяются через CRUD-операции (создание, чтение, обновление, удаление)
- Сохраняются между перезапусками приложения
- Могут быть изменены через веб-интерфейс или напрямую через API

---

## UI-архитектура

### Компоненты shadcn/ui

Проект использует 45 компонентов shadcn/ui (стиль New York). На главной странице задействованы:

| Компонент | Назначение на странице |
|-----------|----------------------|
| `Button` | Кнопки действий (добавить, обновить, удалить, заполнить) |
| `Input` | Текстовое поле для названия |
| `Textarea` | Многострочное поле для описания |
| `Label` | Подписи к полям формы |
| `Card` + `CardHeader/Content/Footer/Title/Description` | Карточки записей, статистики, секций |
| `Badge` | Бейджи технологий, HTTP-методов, ID |
| `Separator` | Разделитель между секциями |
| `Skeleton` | Заглушки при загрузке |
| `Dialog` | Модальное окно редактирования |
| `AlertDialog` | Подтверждение удаления |

### Анимации (Framer Motion)

| Элемент | Анимация |
|---------|---------|
| Hero-секция | Fade-in + slide-up при загрузке |
| Карточки возможностей | Fade-in + slide-up с задержкой (stagger) |
| Записи из БД | Fade + scale при появлении/исчезновении |
| Кнопка обновления | Вращение иконки при загрузке |
| Кнопки действий | Появление при hover на карточке |

---

## Система уведомлений

Для уведомлений используется **Sonner** (toast-библиотека).

### Настройка

```tsx
// layout.tsx
<Toaster richColors position="top-right" />
```

### Использование

```tsx
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

toast({
  title: 'Запись добавлена',
  description: 'Новая запись успешно сохранена',
})

toast({
  title: 'Ошибка',
  description: 'Не удалось добавить запись',
  variant: 'destructive',  // красный цвет для ошибок
})
```

---

## Инфраструктура

### Caddy (Reverse Proxy)

Файл `Caddyfile` настраивает обратный прокси на порту 81:

```
:81 {
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

- По умолчанию все запросы перенаправляются на `localhost:3000` (Next.js)
- Параметр `XTransformPort` позволяет маршрутизировать запросы к другим сервисам

### Конфигурация Next.js

```typescript
// next.config.ts
{
  output: "standalone",        // Самодостаточная сборка для production
  reactStrictMode: false,      // React Strict Mode отключён
  typescript: {
    ignoreBuildErrors: true    // Игнорировать TS-ошибки при сборке
  }
}
```

---

## Безопасность

### Валидация на стороне сервера

Все входящие данные валидируются в API-роутах:

```typescript
// Проверка обязательного поля
if (!name || typeof name !== 'string' || name.trim().length === 0) {
  return NextResponse.json({ error: '...' }, { status: 400 })
}

// Проверка существования записи
const existing = await db.item.findUnique({ where: { id: itemId } })
if (!existing) {
  return NextResponse.json({ error: '...' }, { status: 404 })
}

// Проверка формата ID
if (isNaN(itemId)) {
  return NextResponse.json({ error: '...' }, { status: 400 })
}
```

### Экранирование вывода

В HTML-шаблонах используется JSX, который автоматически экранирует вывод, предотвращая XSS-атаки.

---

## Каталог файлов

| Директория | Назначение |
|-----------|-----------|
| `src/app/` | Страницы, layout и API-роуты (App Router) |
| `src/components/ui/` | Компоненты shadcn/ui (New York стиль) |
| `src/hooks/` | Кастомные React-хуки |
| `src/lib/` | Утилиты и подключение к БД |
| `prisma/` | Схема базы данных |
| `db/` | Файл базы данных SQLite |
| `docs/` | Документация проекта |
| `public/` | Статические файлы (logo, robots.txt) |
| `examples/` | Примеры (WebSocket-чат) |
