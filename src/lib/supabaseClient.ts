import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Definelas en .env.local (desarrollo) o en las variables de entorno del despliegue.',
  );
}

// detectSessionInUrl se apaga a proposito: la app usa HashRouter, que lee
// el mismo fragmento de URL (#...) donde Supabase manda los tokens de un
// link de recuperacion de contrasena. RestablecerPasswordPage.tsx maneja
// esa sesion a mano con supabase.auth.setSession(), evitando que ambos
// (Supabase y el router) intenten interpretar el mismo hash a la vez.
export const supabase = createClient(url, anonKey, {
  auth: { detectSessionInUrl: false },
});

// Cliente "desechable" usado solo para dar de alta la cuenta de un usuario
// nuevo (supabase.auth.signUp) desde Configuracion > Usuarios. Con
// persistSession/autoRefreshToken apagados y su propio storageKey no toca
// localStorage ni la sesion del cliente de arriba, asi que crear a otra
// persona no cierra la sesion del administrador que la esta dando de alta.
export const supabaseAuthAlta = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'breco-alta-usuario' },
});
