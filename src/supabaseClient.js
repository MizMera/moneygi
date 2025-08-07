// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdizrcoizmmcvuqiraev.supabase.co' // Collez votre URL ici
const supabaseAnonKey = 'sb_publishable_8L17yP2Bd3peGGKKSFaWUw_OX3agQBt' // Collez votre Clé ici

export const supabase = createClient(supabaseUrl, supabaseAnonKey)