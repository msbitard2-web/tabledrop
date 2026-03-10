/** Предмет в единой базе (название + иконка) */
export interface Item {
  id: string
  name: string
  iconUrl: string
  /** Исключать из рейтинга "самые популярные" (например серебро) */
  isSilver?: boolean
}

/** Один дроп в таблице — ссылка на предмет из базы + количество и цена */
export interface DropItem {
  id: string
  /** Ссылка на предмет из базы; если нет — используются name/imageUrl (старые данные) */
  itemId?: string
  name?: string
  imageUrl?: string
  quantity: number
  pricePerOne: number
}

/** Данные за один час */
export interface HourData {
  hour: 1 | 2 | 3 | 4 | 5 | 6
  items: DropItem[]
  /** Итого за час вручную (если задано — используется вместо суммы по таблице) */
  totalOverride?: number
}

/** Локация: название + изображение + 6 часов + дропы только в итог */
export interface Location {
  id: string
  name: string
  /** URL изображения (в памяти; в localStorage не хранится, см. IndexedDB) */
  imageUrl?: string
  /** Есть ли изображение в IndexedDB (для загрузки по требованию) */
  hasImage?: boolean
  createdAt: string
  hours: HourData[]
  /** Дропы, добавленные сразу в итог (без привязки к часу) */
  summaryOnlyItems?: DropItem[]
}

export type RatingTab = 'profit' | 'minDrop' | 'maxDrop' | 'silver' | 'runs'
