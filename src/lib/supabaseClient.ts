import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ'

export const supabase = createClient(supabaseUrl, supabaseKey) 