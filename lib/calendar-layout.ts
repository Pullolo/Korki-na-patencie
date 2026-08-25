/**
 * Układ kafelków w kolumnie dnia.
 *
 * Lekcje potrafią się na siebie nakładać — indywidualna w godzinach zajęć
 * grupowych, dwie lekcje tego samego nauczyciela wpisane ręcznie, a w widoku
 * admina po prostu dwóch nauczycieli o tej samej porze. Rysowane na pełną
 * szerokość kolumny zasłaniałyby się nawzajem, więc dzielimy kolumnę na tory:
 * kafelki nachodzące na siebie w czasie dostają osobne tory, a każda niezależna
 * grupa kolizji liczy tory od nowa (żeby jedna kolizja nie ścieśniała reszty dnia).
 */

const DAY_MINUTES = 24 * 60

export type CalendarRange = { startsAt: Date; endsAt: Date }

export type CalendarSlot<T> = {
  item: T
  /** Minuty od północy — gotowe do przeliczenia na piksele. */
  startMin: number
  endMin: number
  /** Numer toru (od 0) i liczba torów w grupie kolizji, do której należy kafelek. */
  lane: number
  lanes: number
}

/**
 * Zakres kafelka w minutach od północy dnia, w którym się zaczyna.
 * Koniec nie później niż początek oznacza przejście przez północ — ucinamy do 24:00,
 * bo kolumna dnia dalej nie sięga.
 */
export function dayRange(range: CalendarRange) {
  const startMin = range.startsAt.getHours() * 60 + range.startsAt.getMinutes()
  const rawEnd = range.endsAt.getHours() * 60 + range.endsAt.getMinutes()
  const crossesMidnight =
    range.endsAt.getTime() - range.startsAt.getTime() > 0 && rawEnd <= startMin
  return { startMin, endMin: crossesMidnight ? DAY_MINUTES : rawEnd }
}

/**
 * Przydziela każdemu wydarzeniu tor i liczbę torów w jego grupie kolizji.
 * Zachłannie: kafelek ląduje w pierwszym torze, który zwolnił się przed jego
 * początkiem, a gdy żaden nie jest wolny — otwieramy kolejny.
 */
export function layoutDayEvents<T extends CalendarRange>(
  events: T[]
): CalendarSlot<T>[] {
  const slots = events
    .map((item) => ({ item, ...dayRange(item) }))
    // Wcześniejsze najpierw, przy równym starcie dłuższe z lewej.
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

  const positioned: Array<CalendarSlot<T>> = []
  let cluster: Array<CalendarSlot<T>> = []
  /** Koniec ostatniego kafelka w każdym torze bieżącej grupy kolizji. */
  let laneEnds: number[] = []

  const closeCluster = () => {
    for (const slot of cluster) slot.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const { item, startMin, endMin } of slots) {
    // Nic z bieżącej grupy nie sięga tego kafelka — kolizja się skończyła.
    if (laneEnds.length > 0 && startMin >= Math.max(...laneEnds)) closeCluster()

    let lane = laneEnds.findIndex((end) => end <= startMin)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = endMin

    const slot: CalendarSlot<T> = { item, startMin, endMin, lane, lanes: 1 }
    cluster.push(slot)
    positioned.push(slot)
  }
  closeCluster()

  return positioned
}
