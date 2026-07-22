import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Revisa tu archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Evita que el pre-escaneo de enlaces de Gmail/Outlook
                       // invalide el token de recuperación antes de que el
                       // usuario haga clic. El "code" solo se puede canjear
                       // desde el navegador que inició la solicitud.
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Se mantiene en false: el canje del código
                               // se hace manualmente en RecuperarPasswordPage.tsx
                               // (y en cualquier otra página que reciba enlaces
                               // de Supabase Auth, como activación de cuenta).
    storage: window.localStorage,
  },
});