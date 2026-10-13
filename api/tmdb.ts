/**
 * Función de Vercel: proxy de solo lectura hacia TMDB. El token vive en la variable de
 * entorno TMDB_TOKEN del servidor y nunca llega al navegador.
 *
 * Uso: /api/tmdb?path=/movie/603&language=es-ES&append_to_response=credits
 */

declare const process: { env: Record<string, string | undefined> };

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Solo las rutas que usa la app: el proxy no sirve para nada más.
const ALLOWED_PATHS = [
  /^\/movie\/(popular|top_rated)$/,
  /^\/movie\/\d+$/,
  /^\/discover\/movie$/,
  /^\/search\/movie$/,
  /^\/person\/\d+\/movie_credits$/,
];

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...extra } });

export async function GET(request: Request): Promise<Response> {
  const token = process.env.TMDB_TOKEN;
  if (!token) return json({ error: 'TMDB_TOKEN no está configurado en el servidor.' }, 500);

  const incoming = new URL(request.url);
  const path = incoming.searchParams.get('path') ?? '';
  if (!ALLOWED_PATHS.some((re) => re.test(path))) return json({ error: 'Ruta no permitida.' }, 400);

  incoming.searchParams.delete('path');
  const upstream = await fetch(`${TMDB_BASE}${path}?${incoming.searchParams}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });

  const cacheable = upstream.ok;
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      'content-type': 'application/json',
      // Los datos de películas cambian poco: la CDN de Vercel los cachea y ahorra llamadas.
      ...(cacheable ? { 'cache-control': 'public, s-maxage=21600, stale-while-revalidate=86400' } : {}),
    },
  });
}
