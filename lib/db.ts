import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type Generation = {
  id: number
  kind: 'image' | 'video'
  model: string
  prompt: string
  content_type: string
  aspect_ratio: string | null
  duration: number | null
  sequence_id: string | null
  created_at: string
}
