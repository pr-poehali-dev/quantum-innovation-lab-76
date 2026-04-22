export const URLS = {
  auth: "https://functions.poehali.dev/ddb63c27-ea26-436f-83c3-8ddd1c630084",
  getGames: "https://functions.poehali.dev/812077fb-2c05-4477-a3b8-4445e707a77d",
  bookGame: "https://functions.poehali.dev/bd53f458-c6fe-4c3d-8125-91df249a17f5",
  getRatings: "https://functions.poehali.dev/aa0c42df-4a4d-4822-93e9-8132faf63097",
  completeTask: "https://functions.poehali.dev/c973d16e-327c-4109-bcb8-9bb01f6d3f90",
}

export const SESSION_KEY = "board_club_user"
export const ADMIN_KEY_STORAGE = "board_club_admin_key"

export type User = { id: number; name: string; email: string; points: number; avatar_url: string | null }
export type Game = { id: number; title: string; description: string; game_date: string; duration_minutes: number; max_players: number; location: string; booked_count: number; free_slots: number }
export type Player = { id: number; name: string; points: number; tasks_done: number; rank: number }
export type Task = { id: number; title: string; description: string; points: number }

export async function fetchGames(): Promise<Game[]> {
  const res = await fetch(URLS.getGames)
  const data = await res.json()
  return data.games || []
}

export async function fetchRatings(): Promise<Player[]> {
  const res = await fetch(URLS.getRatings)
  const data = await res.json()
  return data.ratings || []
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(URLS.completeTask)
  const data = await res.json()
  return data.tasks || []
}

export async function adminFetch(action: string, method = 'GET', body?: object, adminKey = '') {
  const res = await fetch(`${URLS.auth}?action=${action}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export function formatGameDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return "идёт"
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `через ${Math.floor(h / 24)} д.`
  if (h > 0) return `через ${h} ч. ${m} м.`
  return `через ${m} мин.`
}
