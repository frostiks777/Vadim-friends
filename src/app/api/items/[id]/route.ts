import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/items/[id] — обновить запись в БД
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Некорректный ID записи' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Поле "Название" обязательно для заполнения' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли запись
    const existing = await db.item.findUnique({ where: { id: itemId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      )
    }

    const item = await db.item.update({
      where: { id: itemId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Ошибка обновления записи:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить запись' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] — удалить запись из БД
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Некорректный ID записи' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли запись
    const existing = await db.item.findUnique({ where: { id: itemId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      )
    }

    await db.item.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Запись успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления записи:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить запись' },
      { status: 500 }
    )
  }
}
