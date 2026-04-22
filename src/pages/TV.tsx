import { useEffect, useState, useCallback } from "react"
import { LiquidMetalBackground } from "@/components/LiquidMetalBackground"
import { fetchGames, fetchRatings, formatGameDate, timeUntil, type Game, type Player } from "@/lib/api"
import { cn } from "@/lib/utils"

const SLIDE_DURATION = 8000 // ms per slide

type Slide = "clock" | "schedule" | "ratings"
const SLIDES: Slide[] = ["clock", "schedule", "ratings"]

function BigClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const day = now.toLocaleDateString("ru-RU", { weekday: "long" })
  const dateShort = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-[8vw] md:text-[12vw] font-mono font-bold text-white tracking-tight [text-shadow:_0_4px_60px_rgb(255_255_255_/_40%)] leading-none">
        {time}
      </div>
      <div className="text-[3vw] md:text-[4vw] text-gray-300 font-open-sans-custom capitalize tracking-widest text-center">
        <span className="text-white">{day}</span>, {dateShort}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[1.8vw] text-gray-400 font-open-sans-custom">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Клуб настольных игр
      </div>
    </div>
  )
}

function TVSchedule({ games }: { games: Game[] }) {
  const upcoming = games.slice(0, 8)
  return (
    <div className="flex flex-col h-full px-[4vw] py-[3vh]">
      <h2 className="text-[3.5vw] font-extrabold text-white font-open-sans-custom mb-[2vh] [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
        Расписание партий
      </h2>
      <div className="grid grid-cols-2 gap-[1.5vw] flex-1">
        {upcoming.map(g => {
          const isFull = g.free_slots <= 0
          return (
            <div key={g.id} className="rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm px-[2vw] py-[1.5vh] flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="text-white font-semibold font-open-sans-custom text-[1.8vw] leading-tight">{g.title}</div>
                <span className={cn("text-[1.2vw] font-open-sans-custom px-2 py-0.5 rounded-full font-medium shrink-0",
                  isFull ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300")}>
                  {isFull ? "мест нет" : `${g.free_slots} св.`}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-[2vw] text-gray-400 text-[1.3vw] font-open-sans-custom">
                <span>📅 {formatGameDate(g.game_date)}</span>
                <span>⏱ {timeUntil(g.game_date)}</span>
                <span>📍 {g.location}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[1.1vw] text-gray-500 mb-1 font-open-sans-custom">
                  <span>{g.booked_count} / {g.max_players} участников</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={cn("h-full rounded-full", isFull ? "bg-red-400" : "bg-green-400")}
                    style={{ width: `${Math.round(g.booked_count / g.max_players * 100)}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TVRatings({ players }: { players: Player[] }) {
  const top = players.slice(0, 10)
  return (
    <div className="flex flex-col h-full px-[4vw] py-[3vh]">
      <h2 className="text-[3.5vw] font-extrabold text-white font-open-sans-custom mb-[2vh] [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
        Рейтинг участников
      </h2>
      <div className="flex flex-col gap-[1vh] flex-1">
        {top.map((p, i) => (
          <div key={p.id} className={cn(
            "flex items-center gap-[2vw] rounded-xl px-[2vw] py-[1.2vh] border-2",
            i === 0 ? "border-yellow-400/40 bg-yellow-400/10" :
            i === 1 ? "border-gray-300/30 bg-gray-300/5" :
            i === 2 ? "border-orange-400/30 bg-orange-400/5" :
            "border-white/10 bg-white/5"
          )}>
            <div className="text-[2.5vw] w-[4vw] text-center shrink-0">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-400 font-mono text-[1.8vw]">{p.rank}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold font-open-sans-custom text-[2vw] truncate">{p.name}</div>
              <div className="text-gray-400 font-open-sans-custom text-[1.2vw]">{p.tasks_done} заданий</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-white font-bold font-mono text-[2.5vw]">{p.points}</div>
              <div className="text-gray-400 text-[1.1vw] font-open-sans-custom">очков</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TV() {
  const [slide, setSlide] = useState<Slide>("clock")
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [progress, setProgress] = useState(0)

  const loadData = useCallback(async () => {
    const [g, p] = await Promise.all([fetchGames(), fetchRatings()])
    setGames(g); setPlayers(p)
  }, [])

  useEffect(() => {
    loadData()
    const dataInterval = setInterval(loadData, 60000)
    return () => clearInterval(dataInterval)
  }, [loadData])

  useEffect(() => {
    setProgress(0)
    const step = 100 / (SLIDE_DURATION / 100)
    const progressTimer = setInterval(() => setProgress(p => Math.min(p + step, 100)), 100)

    const slideTimer = setTimeout(() => {
      setSlide(cur => {
        const idx = SLIDES.indexOf(cur)
        return SLIDES[(idx + 1) % SLIDES.length]
      })
    }, SLIDE_DURATION)

    return () => { clearInterval(progressTimer); clearTimeout(slideTimer) }
  }, [slide])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 h-full w-full">
        {/* Прогресс-бар */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div className="h-full bg-white/60 transition-none" style={{ width: `${progress}%` }} />
        </div>

        {/* Индикаторы слайдов */}
        <div className="absolute top-4 right-6 z-20 flex gap-2">
          {SLIDES.map(s => (
            <button key={s} onClick={() => setSlide(s)}
              className={cn("w-2 h-2 rounded-full transition-all", s === slide ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60")} />
          ))}
        </div>

        {/* Логотип */}
        <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-white/70">
          <span className="text-2xl">🎲</span>
          <span className="font-open-sans-custom text-lg font-medium">Клуб настольных игр</span>
        </div>

        {/* Контент слайда */}
        <div key={slide} className="h-full w-full animate-fade-in pt-12">
          {slide === "clock" && <BigClock />}
          {slide === "schedule" && <TVSchedule games={games} />}
          {slide === "ratings" && <TVRatings players={players} />}
        </div>
      </div>
    </div>
  )
}
