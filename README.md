# CineMeca 🎬

Juego web/PWA para adivinar películas con pistas, al estilo Spotle Movie pero **sin límite diario**: partidas infinitas seguidas. Películas de cualquier país, época y género, con datos de TMDB.

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- Un token de lectura de la API de TMDB (gratis)

## Cómo obtener el token de TMDB

1. Crea una cuenta en <https://www.themoviedb.org/signup>.
2. Ve a **Ajustes → API** (<https://www.themoviedb.org/settings/api>) y solicita una API key (uso personal / desarrollo).
3. Copia el **API Read Access Token**: es el token largo (JWT) que se usa como `Bearer`, no la "API Key" corta.

## Configuración

```bash
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
```

Edita `.env`:

```
VITE_TMDB_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

> Nota: al ser una app solo de frontend, el token se incluye en el bundle. Es un token de solo lectura, pero si publicas la app conviene pasar las llamadas por un proxy/backend propio.

## Jugar cuando quieras

1. Doble clic en **`Jugar CineMeca.bat`**: prepara la app y la abre en `http://localhost:5173`.
2. La primera vez, en Chrome/Edge pulsa el icono de **Instalar** en la barra de direcciones. Queda como una app con su propio icono.
3. Desde entonces puedes abrirla desde ese icono **sin el .bat**: la app queda guardada en el navegador (service worker) y habla directamente con TMDB. Solo hace falta internet para las películas.
4. Vuelve a usar el `.bat` solo cuando haya cambios en el código, para cargar la versión nueva.

Partidas ilimitadas. El progreso (XP, rachas, Filmoteca) se guarda en el `localStorage` del navegador para `http://localhost:5173` — por eso el puerto es fijo. Si borras los datos del sitio, o usas otro navegador o dispositivo, empiezas de cero.

## Uso (desarrollo)

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests unitarios (Vitest)
npm run build      # build de producción + service worker PWA
npm run preview    # sirve el build (para probar la instalación PWA)
```

## Estructura

```
src/
  api/        tmdb.ts (cliente + cache en memoria), pool.ts (selección aleatoria de la película secreta)
  game/       lógica pura: comparación de pistas, XP/rangos, progreso, pistas, interfaz GameMode (+ tests)
  modes/      implementaciones de GameMode (por ahora: "Pistas")
  hooks/      useGame (máquina de estados de la partida), useMovieSearch, useProfile
  store/      storage.ts (adaptador de persistencia, hoy localStorage) y profileStore
  components/ UI
```

Para añadir un modo nuevo (frame borroso, emojis, contrarreloj) se implementa `GameMode` (`src/game/modes.ts`) en `src/modes/` y se registra en `src/modes/index.ts`.

Para migrar a Supabase basta con escribir otro `StorageAdapter` en `src/store/storage.ts`.

## Atribución

Este producto utiliza la API de TMDB, pero no está avalado ni certificado por TMDB.
