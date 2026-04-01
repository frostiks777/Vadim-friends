import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/items/seed — добавить начальные данные в БД
export async function POST() {
  try {
    const count = await db.item.count()

    if (count > 0) {
      return NextResponse.json({
        message: `В базе уже есть ${count} записей. Начальные данные не добавлены.`,
        count,
      })
    }

    const seedData = [
      {
        name: 'Изучение Next.js',
        description: 'Полный курс по фреймворку Next.js с App Router, Server Components и API Routes.',
      },
      {
        name: 'Работа с базой данных',
        description: 'Подключение SQLite через Prisma ORM. Выполнение CRUD-операций.',
      },
      {
        name: 'Проектирование интерфейса',
        description: 'Создание адаптивного интерфейса с помощью Tailwind CSS и shadcn/ui.',
      },
      {
        name: 'Деплой приложения',
        description: 'Развёртывание production-версии на сервере с настройкой окружения.',
      },
    ]

    const result = await db.item.createMany({
      data: seedData,
    })

    return NextResponse.json({
      message: `Добавлено ${result.count} начальных записей в базу данных.`,
      count: result.count,
    })
  } catch (error) {
    console.error('Ошибка добавления начальных данных:', error)
    return NextResponse.json(
      { error: 'Не удалось добавить начальные данные' },
      { status: 500 }
    )
  }
}
