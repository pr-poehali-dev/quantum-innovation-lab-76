import { useEffect, useRef, useState, useCallback } from "react"
import { LiquidMetalBackground } from "@/components/LiquidMetalBackground"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShinyButton } from "@/components/ui/shiny-button"
import Icon from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const URLS = {
  auth: "https://functions.poehali.dev/ddb63c27-ea26-436f-83c3-8ddd1c630084",
  getGames: "https://functions.poehali.dev/812077fb-2c05-4477-a3b8-4445e707a77d",
  bookGame: "https://functions.poehali.dev/bd53f458-c6fe-4c3d-8125-91df249a17f5",
  getRatings: "https://functions.poehali.dev/aa0c42df-4a4d-4822-93e9-8132faf63097",
  completeTask: "https://functions.poehali.dev/c973d16e-327c-4109-bcb8-9bb01f6d3f90",
}

const SESSION_KEY = "board_club_user"

type User = { id: number; name: string; email: string; points: number; avatar_url: string | null }
type Game = { id: number; title: string; description: string; game_date: string; duration_minutes: number; max_players: number; location: string; booked_count: number; free_slots: number }
type Player = { id: number; name: string; points: number; tasks_done: number; rank: number; avatar_url: string | null }
type Task = { id: number; title: string; description: string; points: number }

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  return (
    <div className="text-center">
      <div className="font-mono text-6xl md:text-8xl font-bold text-white tracking-tight [text-shadow:_0_4px_40px_rgb(255_255_255_/_30%)]">{time}</div>
      <div className="mt-2 text-base md:text-lg text-gray-300 capitalize tracking-widest font-open-sans-custom">{date}</div>
    </div>
  )
}

function formatGameDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return "уже началось"
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `через ${Math.floor(h / 24)} д.`
  if (h > 0) return `через ${h} ч. ${m} мин.`
  return `через ${m} мин.`
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const colors = ["from-purple-500 to-blue-500", "from-green-500 to-teal-500", "from-orange-500 to-red-500", "from-pink-500 to-purple-500", "from-blue-500 to-cyan-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
  return (
    <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", sz, color)}>
      {initials}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className="text-sm text-gray-400 font-mono w-6 text-center">{rank}</span>
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [needName, setNeedName] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const body: Record<string, string> = { email }
    if (needName) body.name = name
    const res = await fetch(URLS.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) {
      if (data.need_name) {
        setNeedName(true)
        setError("Вы новый участник — введите своё имя для регистрации")
      } else {
        setError(data.error)
      }
      return
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
    onLogin(data.user)
  }

  return (
    <div className="relative h-screen overflow-hidden flex items-center justify-center">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/60" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md p-8">
          <div className="text-center mb-8">
            <Icon name="Dices" size={48} className="mx-auto text-white/80 mb-3" />
            <h1 className="text-2xl font-bold text-white font-open-sans-custom">Клуб настольных игр</h1>
            <p className="text-gray-400 text-sm mt-1 font-open-sans-custom">
              {needName ? "Введите имя для регистрации" : "Войдите по вашему email"}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/80 font-open-sans-custom text-sm">Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={needName}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 font-open-sans-custom"
              />
            </div>
            {needName && (
              <div className="space-y-1.5">
                <Label className="text-white/80 font-open-sans-custom text-sm">Ваше имя</Label>
                <Input
                  type="text"
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 font-open-sans-custom"
                />
              </div>
            )}
            {error && (
              <p className="text-sm font-open-sans-custom text-yellow-300 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-100 font-open-sans-custom font-semibold">
              {loading
                ? <span className="flex items-center gap-2"><Icon name="Loader" size={16} className="animate-spin" />Входим...</span>
                : needName ? "Зарегистрироваться" : "Войти"}
            </Button>
            {needName && (
              <button type="button" onClick={() => { setNeedName(false); setError(""); setName("") }}
                className="w-full text-center text-gray-400 text-xs font-open-sans-custom hover:text-white transition-colors">
                ← Другой email
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, onBook, bookedIds, loading }: { game: Game; onBook: (id: number) => void; bookedIds: Set<number>; loading: number | null }) {
  const isFull = game.free_slots <= 0
  const isBooked = bookedIds.has(game.id)
  const isLoading = loading === game.id
  const fillPct = Math.round((game.booked_count / game.max_players) * 100)
  return (
    <div className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-white/25 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-semibold text-base font-open-sans-custom leading-tight">{game.title}</h3>
          <p className="text-gray-400 text-xs mt-1 font-open-sans-custom leading-relaxed">{game.description}</p>
        </div>
        <Badge className={cn("shrink-0 text-xs", isFull ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30")}>
          {isFull ? "Нет мест" : `${game.free_slots} св.`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 font-open-sans-custom">
        <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{formatGameDate(game.game_date)} · {timeUntil(game.game_date)}</span>
        <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{game.location}</span>
        <span className="flex items-center gap-1"><Icon name="Timer" size={11} />{game.duration_minutes} мин.</span>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1 font-open-sans-custom">
          <span>Участники</span><span>{game.booked_count} / {game.max_players}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", isFull ? "bg-red-400" : "bg-green-400")} style={{ width: `${fillPct}%` }} />
        </div>
      </div>
      <Button
        size="sm"
        disabled={(isFull && !isBooked) || isLoading}
        onClick={() => onBook(game.id)}
        className={cn("w-full text-xs font-open-sans-custom mt-1",
          isBooked ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
          : isFull ? "bg-white/5 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-gray-100")}
      >
        {isLoading
          ? <Icon name="Loader" size={13} className="animate-spin" />
          : isBooked
          ? <span className="flex items-center gap-1"><Icon name="CheckCircle" size={13} />Вы записаны</span>
          : isFull ? "Нет мест" : "Записаться"}
      </Button>
    </div>
  )
}

export default function Index() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") } catch { return null }
  })
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [bookedIds, setBookedIds] = useState<Set<number>>(new Set())
  const [bookingLoading, setBookingLoading] = useState<number | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type?: "ok" | "warn" } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string, type: "ok" | "warn" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchGames = useCallback(async () => {
    const res = await fetch(URLS.getGames)
    const data = await res.json()
    setGames(data.games || [])
  }, [])

  const fetchRatings = useCallback(async () => {
    const res = await fetch(URLS.getRatings)
    const data = await res.json()
    setPlayers(data.ratings || [])
  }, [])

  const fetchTasks = useCallback(async () => {
    const res = await fetch(URLS.completeTask)
    const data = await res.json()
    setTasks(data.tasks || [])
  }, [])

  useEffect(() => {
    if (!user) return
    fetchGames(); fetchRatings(); fetchTasks()
    const t = setInterval(fetchGames, 30000)
    return () => clearInterval(t)
  }, [user, fetchGames, fetchRatings, fetchTasks])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const w = el.offsetWidth
      const cur = Math.round(el.scrollLeft / w)
      const total = el.querySelectorAll("section").length - 1
      const target = e.deltaY > 0 ? Math.min(cur + 1, total) : Math.max(cur - 1, 0)
      el.scrollTo({ left: target * w, behavior: "smooth" })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [user])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })

  const handleBook = async (gameId: number) => {
    if (!user || bookingLoading) return
    setBookingLoading(gameId)
    const res = await fetch(URLS.bookGame, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: gameId, user_id: user.id, action: "book" }),
    })
    const data = await res.json()
    setBookingLoading(null)
    if (data.success) {
      if (data.already_booked) {
        showToast("Вы уже записаны на эту партию", "warn")
      } else {
        setBookedIds(prev => new Set([...prev, gameId]))
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, booked_count: g.booked_count + 1, free_slots: g.free_slots - 1 } : g))
        showToast("Вы успешно записаны!")
      }
    } else {
      showToast(data.error || "Ошибка при записи", "warn")
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    if (!user || completedTaskIds.has(taskId)) return
    const res = await fetch(URLS.completeTask, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, user_id: user.id }),
    })
    const data = await res.json()
    if (data.success) {
      if (data.already_done) {
        showToast("Задание уже выполнено", "warn")
      } else {
        setCompletedTaskIds(prev => new Set([...prev, taskId]))
        const updated = { ...user, points: user.points + data.points_added }
        setUser(updated)
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
        showToast(`+${data.points_added} очков начислено!`)
        fetchRatings()
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    setBookedIds(new Set())
    setCompletedTaskIds(new Set())
  }

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />

  const myRank = players.find(p => p.id === user.id)?.rank

  return (
    <main className="relative h-screen overflow-hidden">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/55" />

      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] text-sm font-medium px-5 py-3 rounded-full shadow-2xl font-open-sans-custom whitespace-nowrap",
          toast.type === "warn" ? "bg-yellow-400 text-black" : "bg-white text-black"
        )}>
          {toast.msg}
        </div>
      )}

      <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => scrollTo("home")} className="flex items-center gap-2 text-white shrink-0">
              <Icon name="Dices" size={22} />
              <span className="font-semibold text-base font-open-sans-custom tracking-tight hidden sm:block">Клуб настольных игр</span>
            </button>
            <div className="hidden items-center gap-6 md:flex">
              {([ ["schedule", "Расписание"], ["ratings", "Рейтинг"], ["tasks", "Задания"] ] as [string, string][]).map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm font-open-sans-custom text-gray-300 hover:text-white transition-colors">{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-white text-xs font-medium font-open-sans-custom">{user.name}</span>
                <span className="text-gray-400 text-xs font-mono">{user.points} оч.{myRank ? ` · #${myRank}` : ""}</span>
              </div>
              <Avatar name={user.name} size="sm" />
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors" title="Выйти">
                <Icon name="LogOut" size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        ref={scrollRef}
        className="relative z-10 flex h-screen w-full overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* HERO */}
        <section id="home" className="flex min-w-full snap-start items-center justify-center px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <Icon name="Dices" size={52} className="mx-auto text-white/70 mb-6" />
            <LiveClock />
            <p className="mt-6 text-gray-300 text-lg font-open-sans-custom font-thin tracking-wide">
              Добро пожаловать, <span className="text-white font-medium">{user.name}</span>!
            </p>
            <div className="mt-2 flex items-center justify-center gap-5 text-sm text-gray-400 font-open-sans-custom">
              <span className="flex items-center gap-1"><Icon name="Star" size={13} />{user.points} очков</span>
              {myRank && <span className="flex items-center gap-1"><Icon name="Trophy" size={13} />Место #{myRank}</span>}
              <span className="flex items-center gap-1"><Icon name="Calendar" size={13} />{bookedIds.size} записей</span>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ShinyButton onClick={() => scrollTo("schedule")} className="px-7 py-3 text-base">
                Смотреть расписание
              </ShinyButton>
              <Button variant="outline" onClick={() => scrollTo("ratings")} className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom px-5">
                Мой рейтинг
              </Button>
            </div>
          </div>
        </section>

        {/* SCHEDULE */}
        <section id="schedule" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">Расписание партий</h2>
              <p className="text-gray-400 mt-1 text-sm font-open-sans-custom">Данные обновляются каждые 30 сек.</p>
            </div>
            {games.length === 0
              ? <div className="flex justify-center py-20 text-gray-400"><Icon name="Loader" size={28} className="animate-spin" /></div>
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map(g => <GameCard key={g.id} game={g} onBook={handleBook} bookedIds={bookedIds} loading={bookingLoading} />)}
                </div>
            }
          </div>
        </section>

        {/* RATINGS */}
        <section id="ratings" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">Рейтинг участников</h2>
              <p className="text-gray-400 mt-1 text-sm font-open-sans-custom">Очки за выполненные задания</p>
            </div>
            <div className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              {players.length === 0
                ? <div className="flex justify-center py-16 text-gray-400"><Icon name="Loader" size={28} className="animate-spin" /></div>
                : players.map((p, i) => (
                    <div key={p.id} className={cn(
                      "flex items-center gap-4 px-5 py-4 transition-colors",
                      i < players.length - 1 && "border-b border-white/10",
                      p.id === user.id && "bg-white/10 ring-1 ring-inset ring-white/20",
                      p.rank <= 3 && p.id !== user.id && "bg-white/[0.07]"
                    )}>
                      <RankBadge rank={p.rank} />
                      <Avatar name={p.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium font-open-sans-custom truncate">{p.name}</span>
                          {p.id === user.id && <Badge className="text-[10px] bg-white/20 text-white border-white/30">вы</Badge>}
                        </div>
                        <div className="text-gray-400 text-xs font-open-sans-custom">{p.tasks_done} заданий</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white font-bold font-mono text-lg">{p.points}</div>
                        <div className="text-gray-400 text-xs font-open-sans-custom">очков</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </section>

        {/* TASKS */}
        <section id="tasks" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">Задания</h2>
              <p className="text-gray-400 mt-1 text-sm font-open-sans-custom">Выполняйте — получайте очки — растите в рейтинге</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {tasks.length === 0
                ? <div className="flex justify-center py-16 text-gray-400"><Icon name="Loader" size={28} className="animate-spin" /></div>
                : tasks.map(task => {
                    const done = completedTaskIds.has(task.id)
                    return (
                      <div key={task.id} className={cn(
                        "rounded-xl border-2 bg-white/5 backdrop-blur-sm p-5 flex items-center gap-4 transition-all",
                        done ? "border-green-500/30 opacity-70" : "border-white/10 hover:border-white/25"
                      )}>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg", done ? "bg-green-500/20" : "bg-white/10")}>
                          {done ? "✓" : "🎯"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold font-open-sans-custom">{task.title}</h3>
                          <p className="text-gray-400 text-sm font-open-sans-custom">{task.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 font-mono">+{task.points}</Badge>
                          {!done
                            ? <Button size="sm" onClick={() => handleCompleteTask(task.id)} className="bg-white text-black hover:bg-gray-100 font-open-sans-custom text-xs px-3">
                                Выполнено
                              </Button>
                            : <span className="text-green-400 text-xs font-open-sans-custom">Получено!</span>
                          }
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
