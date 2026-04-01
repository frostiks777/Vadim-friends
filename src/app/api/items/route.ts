import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/items — получить все записи из БД
export async function GET() {
  try {
    const items = await db.item.findMany({
      orderBy: { id: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Ошибка загрузки записей:', error)
    return NextResponse.json(
      { error: 'Не удалось загрузить записи' },
      { status: 500 }
    )
  }
}

// POST /api/items — создать новую запись в БД
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Поле "Название" обязательно для заполнения' },
        { status: 400 }
      )
    }

    const item = await db.item.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания записи:', error)
    return NextResponse.json(
      { error: 'Не удалось создать запись' },
      { status: 500 }
    )
  }
}
