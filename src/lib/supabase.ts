import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'fn_auth',
  },
})

export const STORAGE_URL = `${url}/storage/v1/object/public`
export const IMOVEIS_BUCKET = 'imoveis-fotos'
export const ASSETS_BUCKET = 'assets'
