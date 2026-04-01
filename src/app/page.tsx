'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Database,
  Code2,
  RefreshCw,
  Send,
  X,
  Check,
  AlertCircle,
  LayoutDashboard,
  Layers,
  Globe,
  Cpu,
  Server,
  Palette,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

// ============================================================
// ДАННЫЕ ИЗ КОДА (статическая часть, без БД)
// ============================================================

interface StaticFeature {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  tags: string[]
}

const STATIC_FEATURES: StaticFeature[] = [
  {
    id: 1,
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: 'Современный интерфейс',
    description: 'Адаптивный дизайн с использованием Tailwind CSS и компонентной библиотеки shadcn/ui. Поддержка светлой и тёмной темы.',
    tags: ['Frontend', 'UI/UX', 'CSS'],
  },
  {
    id: 2,
    icon: <Server className="h-6 w-6" />,
    title: 'Серверная архитектура',
    description: 'Next.js App Router с Server Components и API Routes для обработки запросов на стороне сервера.',
    tags: ['Backend', 'API', 'Next.js'],
  },
  {
    id: 3,
    icon: <Database className="h-6 w-6" />,
    title: 'Работа с базой данных',
    description: 'Подключение SQLite через Prisma ORM. Выполнение CRUD-операций: создание, чтение, обновление и удаление записей.',
    tags: ['Database', 'SQLite', 'Prisma'],
  },
  {
    id: 4,
    icon: <Layers className="h-6 w-6" />,
    title: 'Модульная структура',
    description: 'Разделение кода на компоненты, API-роуты и утилиты. Масштабируемая архитектура проекта.',
    tags: ['Architecture', 'Components', 'Modules'],
  },
  {
    id: 5,
    icon: <Globe className="h-6 w-6" />,
    title: 'RESTful API',
    description: 'Полноценный REST API с эндпоинтами для управления данными. Валидация входных данных и обработка ошибок.',
    tags: ['REST', 'HTTP', 'JSON'],
  },
  {
    id: 6,
    icon: <Cpu className="h-6 w-6" />,
    title: 'TypeScript',
    description: 'Строгая типизация для надёжности кода. Интерфейсы и типы для всех структур данных.',
    tags: ['TypeScript', 'Types', 'Safety'],
  },
]

const STATIC_TECH_STACK = [
  { name: 'Next.js 16', category: 'Фреймворк' },
  { name: 'React 19', category: 'Библиотека UI' },
  { name: 'TypeScript 5', category: 'Язык' },
  { name: 'Tailwind CSS 4', category: 'Стили' },
  { name: 'Prisma ORM', category: 'База данных' },
  { name: 'SQLite', category: 'СУБД' },
  { name: 'shadcn/ui', category: 'Компоненты' },
  { name: 'Framer Motion', category: 'Анимации' },
]

// ============================================================
// ТИПЫ ДЛЯ ДАННЫХ ИЗ БАЗЫ ДАННЫХ
// ============================================================

interface Item {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================
// ГЛАВНАЯ СТРАНИЦА
// ============================================================

export default function Home() {
  const { toast } = useToast()

  // --- Состояния для динамических данных из БД ---
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // --- Состояния формы добавления ---
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // --- Состояния формы редактирования ---
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  // ============================================================
  // API-запросы к базе данных
  // ============================================================

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/items')
      if (!response.ok) throw new Error('Ошибка загрузки')
      const data = await response.json()
      setItems(data)
    } catch {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось получить записи из базы данных',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createItem = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Ошибка валидации',
        description: 'Поле "Название" обязательно для заполнения',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Ошибка при добавлении')
      }

      setNewName('')
      setNewDescription('')
      toast({
        title: 'Запись добавлена',
        description: 'Новая запись успешно сохранена в базу данных',
      })
      fetchItems()
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось добавить запись',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateItem = async () => {
    if (!editingItem) return
    if (!editName.trim()) {
      toast({
        title: 'Ошибка валидации',
        description: 'Поле "Название" обязательно для заполнения',
        variant: 'destructive',
      })
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Ошибка при обновлении')
      }

      setEditDialogOpen(false)
      setEditingItem(null)
      toast({
        title: 'Запись обновлена',
        description: 'Изменения успешно сохранены в базу данных',
      })
      fetchItems()
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось обновить запись',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const deleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Ошибка при удалении')
      }

      toast({
        title: 'Запись удалена',
        description: 'Запись успешно удалена из базы данных',
      })
      fetchItems()
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось удалить запись',
        variant: 'destructive',
      })
    }
  }

  const seedDatabase = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/items/seed', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Ошибка заполнения')

      const data = await response.json()
      toast({
        title: 'База данных заполнена',
        description: data.message,
      })
      fetchItems()
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить начальные данные',
        variant: 'destructive',
      })
    } finally {
      setSeeding(false)
    }
  }

  const openEditDialog = (item: Item) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditDescription(item.description || '')
    setEditDialogOpen(true)
  }

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ============================================================
  // РЕНДЕР
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Data Manager</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Управление записями и база данных</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <Code2 className="h-3 w-3" />
              Next.js + Prisma
            </Badge>
            <Badge variant="outline" className="hidden md:flex gap-1">
              <Database className="h-3 w-3" />
              SQLite
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* ===== HERO ===== */}
        <section className="text-center space-y-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Данные: ввод и{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                база данных
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Курсовой проект. Часть данных выводится из кода, а другая часть — из базы данных SQLite.
              Полная поддержка CRUD-операций.
            </p>
          </motion.div>
        </section>

        {/* ===== СТАТИСТИКА ===== */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{STATIC_FEATURES.length}</p>
                <p className="text-sm text-muted-foreground">Возможностей (из кода)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{STATIC_TECH_STACK.length}</p>
                <p className="text-sm text-muted-foreground">Технологий (из кода)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-sm text-muted-foreground">Записей в БД</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">API-эндпоинта</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ===== ЧАСТЬ 1: ДАННЫЕ ИЗ КОДА ===== */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Данные из кода</h3>
              <p className="text-sm text-muted-foreground">
                Статическая информация, хранящаяся непосредственно в исходном коде приложения
              </p>
            </div>
          </div>

          {/* Возможности */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATIC_FEATURES.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {feature.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Технологический стек */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Технологический стек
              </CardTitle>
              <CardDescription>
                Используемые технологии в данном проекте (данные определены в коде)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATIC_TECH_STACK.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-4" />

        {/* ===== ЧАСТЬ 2: ДАННЫЕ ИЗ БАЗЫ ДАННЫХ ===== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Данные из базы данных</h3>
                <p className="text-sm text-muted-foreground">
                  Динамические записи, хранящиеся в SQLite и управляемые через REST API
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchItems}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={seedDatabase}
                disabled={seeding}
              >
                <Database className="h-4 w-4 mr-1.5" />
                {seeding ? 'Загрузка...' : 'Заполнить БД'}
              </Button>
            </div>
          </div>

          {/* Форма добавления */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                Добавить новую запись
              </CardTitle>
              <CardDescription>
                Запись будет сохранена в базу данных SQLite через API-эндпоинт POST /api/items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Название <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Введите название записи..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        createItem()
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Введите описание записи..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={createItem} disabled={submitting || !newName.trim()}>
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                    Добавление...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Добавить в базу
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Список записей из БД */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Записи в базе данных ({items.length})
              </p>
              {items.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  GET /api/items → SQLite
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">База данных пуста</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Добавьте первую запись через форму выше или нажмите &laquo;Заполнить БД&raquo;
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {item.id}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold truncate">{item.name}</h4>
                              <Badge variant="outline" className="text-xs shrink-0">
                                ID: {item.id}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              Создано: {new Date(item.createdAt).toLocaleString('ru-RU')}
                              {item.updatedAt !== item.createdAt && (
                                <> · Обновлено: {new Date(item.updatedAt).toLocaleString('ru-RU')}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите удалить запись &laquo;{item.name}&raquo;?
                                    Это действие нельзя отменить. Запись будет удалена из базы данных.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteItem(item.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* API эндпоинты */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                API-эндпоинты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3 font-mono text-sm">
                <div className="flex items-center gap-2 p-2 rounded bg-background">
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs">GET</Badge>
                  <code>/api/items</code>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-background">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-xs">POST</Badge>
                  <code>/api/items</code>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-background">
                  <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-xs">PUT</Badge>
                  <code>/api/items/[id]</code>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-background">
                  <Badge className="bg-red-600 text-white hover:bg-red-600 text-xs">DELETE</Badge>
                  <code>/api/items/[id]</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Курсовой проект — Управление записями с базой данных</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Code2 className="h-3 w-3" />
                Frontend: React + Tailwind CSS
              </span>
              <span className="flex items-center gap-1">
                <Server className="h-3 w-3" />
                Backend: Next.js API Routes
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                БД: SQLite + Prisma
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== DIALOG РЕДАКТИРОВАНИЯ ===== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Редактировать запись
            </DialogTitle>
            <DialogDescription>
              Изменения будут сохранены в базу данных через PUT /api/items/{editingItem?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-1.5" />
              Отмена
            </Button>
            <Button
              onClick={updateItem}
              disabled={updating || !editName.trim()}
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
