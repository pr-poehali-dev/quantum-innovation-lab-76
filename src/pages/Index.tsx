import { useEffect, useRef, useState, useCallback } from "react"
import { LiquidMetalBackground } from "@/components/LiquidMetalBackground"
import { FloatingNavbar } from "@/components/FloatingNavbar"
import { ShinyButton } from "@/components/ui/shiny-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const URLS = {
  getGames: "https://functions.poehali.dev/812077fb-2c05-4477-a3b8-4445e707a77d",
  bookGame: "https://functions.poehali.dev/bd53f458-c6fe-4c3d-8125-91df249a17f5",
  getRatings: "https://functions.poehali.dev/aa0c42df-4a4d-4822-93e9-8132faf63097",
  completeTask: "https://functions.poehali.dev/c973d16e-327c-4109-bcb8-9bb01f6d3f90",
}

const DEMO_USER_ID = 1

type Game = {
  id: number
  title: string
  description: string
  game_date: string
  duration_minutes: number
  max_players: number
  location: string
  booked_count: number
  free_slots: number
}

type Player = {
  id: number
  name: string
  points: number
  tasks_done: number
  rank: number
  avatar_url: string | null
}

type Task = {
  id: number
  title: string
  description: string
  points: number
}

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
      <div className="font-mono text-7xl md:text-9xl font-bold text-white tracking-tight [text-shadow:_0_4px_40px_rgb(255_255_255_/_30%)]">
        {time}
      </div>
      <div className="mt-3 text-lg md:text-xl text-gray-300 capitalize tracking-widest font-open-sans-custom">
        {date}
      </div>
    </div>
  )
}

function formatGameDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
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

function GameCard({ game, onBook, bookedIds }: { game: Game; onBook: (id: number) => void; bookedIds: Set<number> }) {
  const isFull = game.free_slots <= 0
  const isBooked = bookedIds.has(game.id)
  const fillPercent = Math.round((game.booked_count / game.max_players) * 100)

  return (
    <div className="relative rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-white/25 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-semibold text-lg font-open-sans-custom leading-tight">{game.title}</h3>
          <p className="text-gray-400 text-xs mt-1 font-open-sans-custom">{game.description}</p>
        </div>
        <Badge className={cn("shrink-0 text-xs", isFull ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30")}>
          {isFull ? "Мест нет" : `${game.free_slots} св.`}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400 font-open-sans-custom">
        <span className="flex items-center gap-1">
          <Icon name="Clock" size={12} />
          {formatGameDate(game.game_date)} · {timeUntil(game.game_date)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="MapPin" size={12} />
          {game.location}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="Timer" size={12} />
          {game.duration_minutes} мин.
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1 font-open-sans-custom">
          <span>Участники</span>
          <span>{game.booked_count} / {game.max_players}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", isFull ? "bg-red-400" : "bg-green-400")}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <Button
        size="sm"
        disabled={isFull && !isBooked}
        onClick={() => onBook(game.id)}
        className={cn(
          "w-full text-xs font-open-sans-custom mt-1",
          isBooked
            ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
            : isFull
            ? "bg-white/5 text-gray-500 cursor-not-allowed"
            : "bg-white text-black hover:bg-gray-100"
        )}
      >
        {isBooked ? (
          <span className="flex items-center gap-1"><Icon name="CheckCircle" size={13} /> Вы записаны</span>
        ) : isFull ? (
          "Нет мест"
        ) : (
          "Записаться"
        )}
      </Button>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className="text-sm text-gray-400 font-mono w-6 text-center">{rank}</span>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const colors = ["from-purple-500 to-blue-500", "from-green-500 to-teal-500", "from-orange-500 to-red-500", "from-pink-500 to-purple-500", "from-blue-500 to-cyan-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0", color)}>
      {initials}
    </div>
  )
}

export default function Index() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [bookedIds, setBookedIds] = useState<Set<number>>(new Set())
  const [bookingLoading, setBookingLoading] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
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
    fetchGames()
    fetchRatings()
    fetchTasks()
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [fetchGames, fetchRatings, fetchTasks])

  const handleBook = async (gameId: number) => {
    if (bookingLoading) return
    setBookingLoading(gameId)
    const res = await fetch(URLS.bookGame, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: gameId, user_id: DEMO_USER_ID, action: "book" }),
    })
    const data = await res.json()
    setBookingLoading(null)
    if (data.success) {
      if (data.already_booked) {
        showToast("Вы уже записаны на эту партию")
      } else {
        setBookedIds(prev => new Set([...prev, gameId]))
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, booked_count: g.booked_count + 1, free_slots: g.free_slots - 1 } : g))
        showToast("Вы успешно записаны!")
      }
    } else {
      showToast(data.error || "Ошибка при записи")
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    const res = await fetch(URLS.completeTask, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, user_id: DEMO_USER_ID }),
    })
    const data = await res.json()
    if (data.success) {
      if (data.already_done) {
        showToast("Задание уже выполнено")
      } else {
        showToast(`+${data.points_added} очков начислено!`)
        fetchRatings()
      }
    }
  }

  // horizontal scroll with wheel
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const w = el.offsetWidth
      const cur = Math.round(el.scrollLeft / w)
      const sections = el.querySelectorAll("section")
      const total = sections.length - 1
      const target = e.deltaY > 0 ? Math.min(cur + 1, total) : Math.max(cur - 1, 0)
      el.scrollTo({ left: target * w, behavior: "smooth" })
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
  }

  return (
    <main className="relative h-screen overflow-hidden">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/55" />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white text-black text-sm font-medium px-5 py-3 rounded-full shadow-2xl animate-fade-in font-open-sans-custom">
          {toast}
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button onClick={() => scrollTo("home")} className="flex items-center gap-2 text-white">
              <Icon name="Dices" size={24} />
              <span className="font-semibold text-lg font-open-sans-custom tracking-tight">Клуб настольных игр</span>
            </button>
            <div className="hidden items-center gap-8 md:flex">
              {[["schedule", "Расписание"], ["ratings", "Рейтинг"], ["tasks", "Задания"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm font-open-sans-custom text-gray-300 hover:text-white transition-colors">
                  {label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => scrollTo("schedule")} className="bg-white text-black hover:bg-gray-100 font-open-sans-custom">
              Записаться
            </Button>
          </div>
        </div>
      </nav>

      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex h-screen w-full overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* HERO */}
        <section id="home" className="flex min-w-full snap-start items-center justify-center px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <Icon name="Dices" size={56} className="mx-auto text-white/80 mb-4" />
            </div>
            <LiveClock />
            <p className="mt-8 text-gray-300 text-xl font-open-sans-custom font-thin tracking-wide">
              Клуб настольных игр · записывайтесь, играйте, зарабатывайте очки
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <ShinyButton onClick={() => scrollTo("schedule")} className="px-8 py-3 text-base">
                Смотреть расписание
              </ShinyButton>
              <Button variant="outline" onClick={() => scrollTo("ratings")} className="border-white/20 text-white hover:bg-white/10 font-open-sans-custom px-6">
                Рейтинг
              </Button>
            </div>
          </div>
        </section>

        {/* SCHEDULE */}
        <section id="schedule" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
                Расписание партий
              </h2>
              <p className="text-gray-400 mt-2 font-open-sans-custom">
                Выберите игру и запишитесь — данные обновляются каждые 30 сек.
              </p>
            </div>
            {games.length === 0 ? (
              <div className="text-center text-gray-400 py-20 font-open-sans-custom">
                <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
                Загружаем расписание...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => (
                  <GameCard key={game.id} game={game} onBook={handleBook} bookedIds={bookedIds} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RATINGS */}
        <section id="ratings" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
                Рейтинг участников
              </h2>
              <p className="text-gray-400 mt-2 font-open-sans-custom">
                Очки начисляются за выполненные задания
              </p>
            </div>
            <div className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              {players.length === 0 ? (
                <div className="text-center text-gray-400 py-16 font-open-sans-custom">
                  <Icon name="Loader" size={28} className="mx-auto mb-3 animate-spin" />
                  Загружаем рейтинг...
                </div>
              ) : (
                players.map((p, i) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 transition-colors",
                      i < players.length - 1 && "border-b border-white/10",
                      p.rank <= 3 && "bg-white/5"
                    )}
                  >
                    <RankBadge rank={p.rank} />
                    <Avatar name={p.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium font-open-sans-custom truncate">{p.name}</div>
                      <div className="text-gray-400 text-xs font-open-sans-custom">{p.tasks_done} заданий выполнено</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-white font-bold font-mono text-lg">{p.points}</div>
                      <div className="text-gray-400 text-xs font-open-sans-custom">очков</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* TASKS */}
        <section id="tasks" className="min-w-full snap-start overflow-y-auto px-4 pt-24 pb-10" style={{ scrollbarWidth: "none" }}>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-white font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
                Задания
              </h2>
              <p className="text-gray-400 mt-2 font-open-sans-custom">
                Выполняйте задания — получайте очки и поднимайтесь в рейтинге
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 py-16 font-open-sans-custom">
                  <Icon name="Loader" size={28} className="mx-auto mb-3 animate-spin" />
                  Загружаем задания...
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-white/25 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-semibold font-open-sans-custom">{task.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 font-open-sans-custom">{task.description}</p>
                      </div>
                      <Badge className="shrink-0 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 font-mono">
                        +{task.points}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                      className="w-full bg-white text-black hover:bg-gray-100 font-open-sans-custom text-xs"
                    >
                      <Icon name="Trophy" size={13} className="mr-1" />
                      Отметить выполненным
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
