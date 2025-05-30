import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgqtllbobikwychknsuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncXRsbGJvYmlrd3ljaGtuc3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDIwNTMsImV4cCI6MjA2MzExODA1M30.Bt2LHYa3jVv3xtAqeoAOLEmiaf8qBWSKYQiBchU6oME';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);