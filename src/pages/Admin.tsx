import { useEffect, useState, useCallback } from "react"
import { LiquidMetalBackground } from "@/components/LiquidMetalBackground"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { adminFetch, ADMIN_KEY_STORAGE, formatGameDate, type User, type Game } from "@/lib/api"

// ─── Вход в админку ──────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    const data = await adminFetch('users', 'GET', undefined, key)
    setLoading(false)
    if (data.error) { setError("Неверный ключ администратора"); return }
    localStorage.setItem(ADMIN_KEY_STORAGE, key)
    onLogin(key)
  }

  return (
    <div className="relative h-screen overflow-hidden flex items-center justify-center">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/65" />
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md p-8">
          <div className="text-center mb-7">
            <Icon name="ShieldCheck" size={44} className="mx-auto text-white/70 mb-3" />
            <h1 className="text-xl font-bold text-white font-open-sans-custom">Панель администратора</h1>
            <p className="text-gray-400 text-sm mt-1 font-open-sans-custom">Введите ключ доступа</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/80 font-open-sans-custom text-sm">Ключ администратора</Label>
              <Input type="password" placeholder="••••••••" value={key} onChange={e => setKey(e.target.value)}
                required className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" />
            </div>
            {error && <p className="text-sm text-red-300 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20 font-open-sans-custom">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-100 font-open-sans-custom font-semibold">
              {loading ? <span className="flex items-center gap-2"><Icon name="Loader" size={16} className="animate-spin" />Проверка...</span> : "Войти"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] text-sm font-medium px-5 py-3 rounded-full shadow-2xl font-open-sans-custom whitespace-nowrap",
      type === "err" ? "bg-red-500 text-white" : "bg-white text-black")}>
      {msg}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-lg font-bold text-white font-open-sans-custom mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 font-open-sans-custom text-xs">{label}</Label>
      {children}
    </div>
  )
}

const inputCls = "bg-white/10 border-white/20 text-white placeholder:text-gray-500 font-open-sans-custom text-sm"

// ─── Панель управления ────────────────────────────────────────────────────────

function AdminPanel({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"users" | "games">("games")
  const [users, setUsers] = useState<User[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  // Форма нового пользователя
  const [newUser, setNewUser] = useState({ name: "", email: "", points: "0" })
  // Форма новой игры
  const [newGame, setNewGame] = useState({ title: "", description: "", game_date: "", duration_minutes: "120", max_players: "6", location: "Клуб настольных игр" })
  // Редактирование игры
  const [editGame, setEditGame] = useState<(Game & { _editing?: boolean }) | null>(null)
  // Редактирование пользователя
  const [editUser, setEditUser] = useState<{ id: number; name: string; points: string } | null>(null)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [ud, gd] = await Promise.all([
      adminFetch('users', 'GET', undefined, adminKey),
      adminFetch('games', 'GET', undefined, adminKey),
    ])
    setUsers(ud.users || []); setGames(gd.games || [])
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = await adminFetch('create_user', 'POST', { name: newUser.name, email: newUser.email, points: Number(newUser.points) }, adminKey)
    if (data.error) { showToast(data.error, "err"); return }
    showToast("Пользователь добавлен")
    setNewUser({ name: "", email: "", points: "0" }); load()
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return
    const data = await adminFetch('update_user', 'PUT', { id: editUser.id, name: editUser.name, points: Number(editUser.points) }, adminKey)
    if (data.error) { showToast(data.error, "err"); return }
    showToast("Сохранено"); setEditUser(null); load()
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = await adminFetch('create_game', 'POST', {
      ...newGame,
      duration_minutes: Number(newGame.duration_minutes),
      max_players: Number(newGame.max_players),
    }, adminKey)
    if (data.error) { showToast(data.error, "err"); return }
    showToast("Игра добавлена")
    setNewGame({ title: "", description: "", game_date: "", duration_minutes: "120", max_players: "6", location: "Клуб настольных игр" })
    load()
  }

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editGame) return
    const data = await adminFetch('update_game', 'PUT', {
      id: editGame.id, title: editGame.title, description: editGame.description,
      game_date: editGame.game_date, duration_minutes: Number(editGame.duration_minutes),
      max_players: Number(editGame.max_players), location: editGame.location,
    }, adminKey)
    if (data.error) { showToast(data.error, "err"); return }
    showToast("Игра обновлена"); setEditGame(null); load()
  }

  // Преобразование ISO → datetime-local input value
  const toInputDate = (iso: string) => iso ? iso.slice(0, 16) : ""

  return (
    <div className="relative min-h-screen overflow-auto">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/65" />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon name="ShieldCheck" size={24} className="text-white/70" />
            <div>
              <h1 className="text-xl font-bold text-white font-open-sans-custom">Администратор</h1>
              <p className="text-gray-400 text-xs font-open-sans-custom">Клуб настольных игр</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom text-xs">
              <Icon name="RefreshCw" size={13} className={cn("mr-1", loading && "animate-spin")} />Обновить
            </Button>
            <Button size="sm" variant="outline" onClick={onLogout} className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom text-xs">
              <Icon name="LogOut" size={13} className="mr-1" />Выйти
            </Button>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 w-fit">
          {(["games", "users"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-5 py-2 rounded-lg text-sm font-open-sans-custom transition-all",
                tab === t ? "bg-white text-black font-medium" : "text-gray-300 hover:text-white")}>
              {t === "games" ? `🎲 Расписание (${games.length})` : `👥 Участники (${users.length})`}
            </button>
          ))}
        </div>

        {/* ── РАСПИСАНИЕ ── */}
        {tab === "games" && (
          <div className="space-y-5">
            {/* Форма добавления */}
            <Section title="Добавить партию">
              <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Название игры *">
                  <Input value={newGame.title} onChange={e => setNewGame(p => ({ ...p, title: e.target.value }))} placeholder="Колонизаторы" required className={inputCls} />
                </Field>
                <Field label="Дата и время *">
                  <Input type="datetime-local" value={newGame.game_date} onChange={e => setNewGame(p => ({ ...p, game_date: e.target.value }))} required className={inputCls} />
                </Field>
                <Field label="Описание">
                  <Input value={newGame.description} onChange={e => setNewGame(p => ({ ...p, description: e.target.value }))} placeholder="Краткое описание" className={inputCls} />
                </Field>
                <Field label="Место">
                  <Input value={newGame.location} onChange={e => setNewGame(p => ({ ...p, location: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Макс. участников">
                  <Input type="number" min="2" max="20" value={newGame.max_players} onChange={e => setNewGame(p => ({ ...p, max_players: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Длительность (мин.)">
                  <Input type="number" min="30" max="360" value={newGame.duration_minutes} onChange={e => setNewGame(p => ({ ...p, duration_minutes: e.target.value }))} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Button type="submit" className="bg-white text-black hover:bg-gray-100 font-open-sans-custom">
                    <Icon name="Plus" size={15} className="mr-1" />Добавить партию
                  </Button>
                </div>
              </form>
            </Section>

            {/* Список игр */}
            <Section title="Все партии">
              {games.length === 0
                ? <p className="text-gray-400 font-open-sans-custom text-sm">Нет партий</p>
                : <div className="space-y-2">
                    {games.map(g => (
                      <div key={g.id}>
                        {editGame?.id === g.id ? (
                          <form onSubmit={handleUpdateGame} className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Название">
                                <Input value={editGame.title} onChange={e => setEditGame(p => p && ({ ...p, title: e.target.value }))} className={inputCls} />
                              </Field>
                              <Field label="Дата и время">
                                <Input type="datetime-local" value={toInputDate(editGame.game_date)} onChange={e => setEditGame(p => p && ({ ...p, game_date: e.target.value }))} className={inputCls} />
                              </Field>
                              <Field label="Описание">
                                <Input value={editGame.description || ""} onChange={e => setEditGame(p => p && ({ ...p, description: e.target.value }))} className={inputCls} />
                              </Field>
                              <Field label="Место">
                                <Input value={editGame.location} onChange={e => setEditGame(p => p && ({ ...p, location: e.target.value }))} className={inputCls} />
                              </Field>
                              <Field label="Макс. участников">
                                <Input type="number" min="2" value={editGame.max_players} onChange={e => setEditGame(p => p && ({ ...p, max_players: Number(e.target.value) }))} className={inputCls} />
                              </Field>
                              <Field label="Длительность (мин.)">
                                <Input type="number" min="30" value={editGame.duration_minutes} onChange={e => setEditGame(p => p && ({ ...p, duration_minutes: Number(e.target.value) }))} className={inputCls} />
                              </Field>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" className="bg-white text-black hover:bg-gray-100 font-open-sans-custom text-xs">Сохранить</Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setEditGame(null)} className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom text-xs">Отмена</Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium font-open-sans-custom text-sm">{g.title}</span>
                                <Badge className="text-[10px] bg-white/10 text-gray-300 border-white/20 font-open-sans-custom">
                                  {g.booked_count}/{g.max_players} мест
                                </Badge>
                              </div>
                              <div className="text-gray-400 text-xs font-open-sans-custom mt-0.5">
                                {formatGameDate(g.game_date)} · {g.location}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setEditGame(g)}
                              className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom text-xs shrink-0">
                              <Icon name="Pencil" size={12} className="mr-1" />Изменить
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </Section>
          </div>
        )}

        {/* ── УЧАСТНИКИ ── */}
        {tab === "users" && (
          <div className="space-y-5">
            {/* Форма добавления */}
            <Section title="Зарегистрировать участника">
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Field label="Имя *">
                  <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" required className={inputCls} />
                </Field>
                <Field label="Email *">
                  <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="ivan@example.com" required className={inputCls} />
                </Field>
                <Field label="Начальные очки">
                  <Input type="number" min="0" value={newUser.points} onChange={e => setNewUser(p => ({ ...p, points: e.target.value }))} className={inputCls} />
                </Field>
                <div className="md:col-span-3">
                  <Button type="submit" className="bg-white text-black hover:bg-gray-100 font-open-sans-custom">
                    <Icon name="UserPlus" size={15} className="mr-1" />Добавить участника
                  </Button>
                </div>
              </form>
            </Section>

            {/* Список */}
            <Section title={`Участники (${users.length})`}>
              {users.length === 0
                ? <p className="text-gray-400 font-open-sans-custom text-sm">Нет участников</p>
                : <div className="space-y-2">
                    {users.map((u, i) => (
                      <div key={u.id}>
                        {editUser?.id === u.id ? (
                          <form onSubmit={handleUpdateUser} className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3">
                            <span className="text-gray-400 text-sm font-mono w-5 shrink-0">{i + 1}</span>
                            <Input value={editUser.name} onChange={e => setEditUser(p => p && ({ ...p, name: e.target.value }))} className={cn(inputCls, "flex-1 h-8 text-xs")} />
                            <div className="flex items-center gap-1 shrink-0">
                              <Input type="number" min="0" value={editUser.points} onChange={e => setEditUser(p => p && ({ ...p, points: e.target.value }))}
                                className={cn(inputCls, "w-20 h-8 text-xs")} />
                              <span className="text-gray-400 text-xs font-open-sans-custom">оч.</span>
                            </div>
                            <Button type="submit" size="sm" className="bg-white text-black hover:bg-gray-100 font-open-sans-custom text-xs h-8 px-3">✓</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditUser(null)} className="border-white/20 text-white hover:bg-white/10 h-8 px-3 text-xs">✕</Button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 transition-all">
                            <span className="text-gray-500 text-xs font-mono w-5 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium font-open-sans-custom text-sm truncate">{u.name}</div>
                              <div className="text-gray-400 text-xs font-open-sans-custom">{u.email}</div>
                            </div>
                            <div className="text-right shrink-0 mr-2">
                              <div className="text-white font-mono font-bold text-sm">{u.points}</div>
                              <div className="text-gray-400 text-xs font-open-sans-custom">очков</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setEditUser({ id: u.id, name: u.name, points: String(u.points) })}
                              className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom text-xs shrink-0">
                              <Icon name="Pencil" size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Экспорт ──────────────────────────────────────────────────────────────────

export default function Admin() {
  const [adminKey, setAdminKey] = useState<string | null>(() => localStorage.getItem(ADMIN_KEY_STORAGE))

  const handleLogout = () => { localStorage.removeItem(ADMIN_KEY_STORAGE); setAdminKey(null) }

  if (!adminKey) return <AdminLogin onLogin={k => setAdminKey(k)} />
  return <AdminPanel adminKey={adminKey} onLogout={handleLogout} />
}
