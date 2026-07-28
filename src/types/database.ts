export type TripStatus = 'planning' | 'ongoing' | 'completed'
export type MediaType = 'photo' | 'video' | 'voice' | 'ticket'

// NOTE: these must be `type` aliases, not `interface`s. supabase-js's generic
// client requires each table's Row/Insert/Update to structurally satisfy
// Record<string, unknown>, and TypeScript only recognizes that for `type`
// aliases — a same-shaped `interface` fails the check (no implicit index
// signature), which silently collapses every query's argument/result types
// to `never`.
export type Trip = {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_photo_url: string | null
  start_date: string | null
  end_date: string | null
  status: TripStatus
  cover_stickers: string[] | null
  created_at: string
}

export type BucketListItem = {
  id: string
  user_id: string
  trip_id: string | null
  place_name: string
  country: string | null
  notes: string | null
  is_done: boolean
  lat: number | null
  lng: number | null
  created_at: string
}

export type Pin = {
  id: string
  trip_id: string
  lat: number
  lng: number
  label: string
  notes: string | null
  visited_at: string | null
  country: string | null
  city: string | null
  created_at: string
}

export type Media = {
  id: string
  trip_id: string
  pin_id: string | null
  type: MediaType
  storage_path: string
  caption: string | null
  taken_at: string | null
  stickers: string[] | null
  created_at: string
}

export type Flight = {
  id: string
  trip_id: string
  airline: string | null
  flight_number: string | null
  from_airport: string
  to_airport: string
  date: string | null
  notes: string | null
  created_at: string
}

export type ScrapbookBlockType = 'photo' | 'text'

export type ScrapbookBlock = {
  id: string
  trip_id: string
  type: ScrapbookBlockType
  media_id: string | null
  text_content: string | null
  font: string | null
  color: string | null
  x: number
  y: number
  width: number
  rotation: number
  z_index: number
  created_at: string
}

// Minimal hand-written schema shape (in place of Supabase's generated types)
// so the typed client (createClient<Database>) has row/insert/update shapes
// to check against. Regenerate with `supabase gen types` once the project
// is live if the schema drifts from this file. Each table needs Relationships
// (even if empty) and the schema needs Views/Functions to satisfy supabase-js's
// GenericSchema constraint.
export type Database = {
  public: {
    Tables: {
      trips: {
        Row: Trip
        Insert: Omit<Trip, 'id' | 'created_at' | 'cover_stickers'> & {
          id?: string
          created_at?: string
          cover_stickers?: string[] | null
        }
        Update: Partial<Omit<Trip, 'id' | 'user_id'>>
        Relationships: []
      }
      bucket_list_items: {
        Row: BucketListItem
        Insert: Omit<BucketListItem, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<BucketListItem, 'id' | 'user_id'>>
        Relationships: []
      }
      pins: {
        Row: Pin
        Insert: Omit<Pin, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Pin, 'id' | 'trip_id'>>
        Relationships: []
      }
      media: {
        Row: Media
        Insert: Omit<Media, 'id' | 'created_at' | 'stickers'> & {
          id?: string
          created_at?: string
          stickers?: string[] | null
        }
        Update: Partial<Omit<Media, 'id' | 'trip_id'>>
        Relationships: []
      }
      flights: {
        Row: Flight
        Insert: Omit<Flight, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Flight, 'id' | 'trip_id'>>
        Relationships: []
      }
      scrapbook_blocks: {
        Row: ScrapbookBlock
        Insert: Omit<
          ScrapbookBlock,
          'id' | 'created_at' | 'x' | 'y' | 'width' | 'rotation' | 'z_index' | 'media_id' | 'text_content' | 'font' | 'color'
        > & {
          id?: string
          created_at?: string
          x?: number
          y?: number
          width?: number
          rotation?: number
          z_index?: number
          media_id?: string | null
          text_content?: string | null
          font?: string | null
          color?: string | null
        }
        Update: Partial<Omit<ScrapbookBlock, 'id' | 'trip_id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
