import { readCache, writeCache } from '@/api/cache';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p';

const TTL = {
  list: 60 * 60 * 1000,
  detail: 12 * 60 * 60 * 1000,
  static: 7 * 24 * 60 * 60 * 1000,
} as const;

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'TmdbError';
  }
}

export const ImageSize = {
  posterSmall: 'w185',
  poster: 'w342',
  posterLarge: 'w500',
  backdrop: 'w780',
  backdropLarge: 'w1280',
  profile: 'w185',
  still: 'w300',
  logo: 'w92',
  original: 'original',
} as const;

export function imageUrl(
  path: string | null | undefined,
  size: (typeof ImageSize)[keyof typeof ImageSize] = ImageSize.poster,
): string | null {
  if (!path) return null;
  return `${IMAGE_URL}/${size}${path}`;
}

type Params = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, params: Params): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY ?? '');
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

const cacheKey = (path: string, params: Params) =>
  `${path}?${Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('&')}`;

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TmdbError('Network unavailable. Check your connection and try again.');
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new TmdbError(detail?.status_message ?? `Request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, params: Params = {}, ttl = 0): Promise<T> {
  if (!API_KEY) {
    throw new TmdbError(
      'Missing EXPO_PUBLIC_TMDB_API_KEY. Copy .env.example to .env and add your TMDB key, then restart the dev server.',
    );
  }

  const key = cacheKey(path, params);
  const cached = ttl > 0 ? await readCache<T>(key) : null;
  if (cached && cached.age < ttl) return cached.value;

  try {
    const data = await fetchJson<T>(buildUrl(path, params));
    if (ttl > 0) void writeCache(key, data);
    return data;
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

export type MediaType = 'movie' | 'tv';

export interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: MediaType | 'person';
  popularity?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: { avatar_path: string | null; rating: number | null; username: string };
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface ProviderGroup {
  link?: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  ads?: Provider[];
  free?: Provider[];
}

export interface CollectionRef {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface Collection extends CollectionRef {
  overview: string;
  parts: Media[];
}

export interface SeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface SeasonDetail {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  episodes: Episode[];
}

export interface MovieDetail extends Media {
  runtime: number | null;
  episode_run_time?: number[];
  genres: Genre[];
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
  spoken_languages: { english_name: string; iso_639_1: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  belongs_to_collection: CollectionRef | null;
  seasons?: SeasonSummary[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  videos: { results: Video[] };
  credits: { cast: CastMember[]; crew: CrewMember[] };
  images: { backdrops: { file_path: string }[] };
  similar: { results: Media[] };
  recommendations: { results: Media[] };
  reviews: { results: Review[] };
  'watch/providers': { results: Record<string, ProviderGroup> };
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  profile_path: string | null;
  combined_credits: { cast: Media[] };
}

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export const SORT_OPTIONS = [
  { key: 'popularity.desc', label: 'Most popular' },
  { key: 'vote_average.desc', label: 'Highest rated' },
  { key: 'primary_release_date.desc', label: 'Newest' },
  { key: 'revenue.desc', label: 'Top grossing' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['key'];

export interface DiscoverFilters {
  genreId?: number;
  sortBy?: SortKey;
  minRating?: number;
  year?: number;
}

export const tmdb = {
  trending: () => request<Paged<Media>>('/trending/movie/day', {}, TTL.list),
  popular: (page = 1) => request<Paged<Media>>('/movie/popular', { page }, TTL.list),
  topRated: (page = 1) => request<Paged<Media>>('/movie/top_rated', { page }, TTL.list),
  upcoming: (page = 1) => request<Paged<Media>>('/movie/upcoming', { page }, TTL.list),
  nowPlaying: (page = 1) => request<Paged<Media>>('/movie/now_playing', { page }, TTL.list),
  onTheAir: (page = 1) => request<Paged<Media>>('/tv/on_the_air', { page }, TTL.list),

  genres: () => request<{ genres: Genre[] }>('/genre/movie/list', {}, TTL.static).then((r) => r.genres),

  discover: (filters: DiscoverFilters = {}, page = 1) =>
    request<Paged<Media>>(
      '/discover/movie',
      {
        page,
        with_genres: filters.genreId,
        sort_by: filters.sortBy ?? 'popularity.desc',
        'vote_average.gte': filters.minRating || undefined,
        primary_release_year: filters.year,
        // without a vote floor a single 10/10 tops the highest-rated sort
        'vote_count.gte': filters.sortBy === 'vote_average.desc' ? 300 : 50,
      },
      TTL.list,
    ),

  search: (query: string, page = 1) =>
    request<Paged<Media>>('/search/multi', { query, page, include_adult: false }).then((paged) => ({
      ...paged,
      results: paged.results.filter((item) => item.media_type !== 'person'),
    })),

  movie: (id: number) =>
    request<MovieDetail>(
      `/movie/${id}`,
      {
        append_to_response: 'videos,credits,images,similar,recommendations,reviews,watch/providers',
        include_image_language: 'en,null',
      },
      TTL.detail,
    ),

  tv: (id: number) =>
    request<MovieDetail>(
      `/tv/${id}`,
      {
        append_to_response: 'videos,credits,images,similar,recommendations,reviews,watch/providers',
        include_image_language: 'en,null',
      },
      TTL.detail,
    ),

  season: (tvId: number, seasonNumber: number) =>
    request<SeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`, {}, TTL.detail),

  collection: (id: number) => request<Collection>(`/collection/${id}`, {}, TTL.detail),

  person: (id: number) =>
    request<PersonDetail>(`/person/${id}`, { append_to_response: 'combined_credits' }, TTL.detail),
};

export const mediaTitle = (item: Media) => item.title ?? item.name ?? 'Untitled';
export const mediaDate = (item: Media) => item.release_date ?? item.first_air_date ?? '';
export const mediaYear = (item: Media) => mediaDate(item).slice(0, 4);

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

const VIDEO_RANK: Record<string, number> = { Trailer: 0, Teaser: 1, Clip: 2, Featurette: 3 };

export function sortVideos(videos: Video[] = []): Video[] {
  return videos
    .filter((video) => video.site === 'YouTube')
    .slice()
    .sort((a, b) => {
      const byType = (VIDEO_RANK[a.type] ?? 9) - (VIDEO_RANK[b.type] ?? 9);
      if (byType !== 0) return byType;
      if (a.official !== b.official) return a.official ? -1 : 1;
      return (b.published_at ?? '').localeCompare(a.published_at ?? '');
    });
}

export function pickTrailer(videos: Video[] = []): Video | undefined {
  return sortVideos(videos)[0];
}

export const youtubeUrl = (key: string) => `https://www.youtube.com/watch?v=${key}`;
export const youtubeThumb = (key: string) => `https://img.youtube.com/vi/${key}/hqdefault.jpg`;

export interface ProviderOffer {
  provider: Provider;
  kind: 'stream' | 'free' | 'rent' | 'buy';
}

export function providersForRegion(
  groups: Record<string, ProviderGroup> | undefined,
  region: string,
): { offers: ProviderOffer[]; link?: string } {
  const group = groups?.[region];
  if (!group) return { offers: [] };

  const seen = new Set<number>();
  const offers: ProviderOffer[] = [];

  // first bucket a service shows up in wins, so streaming beats rent/buy
  const buckets: [Provider[] | undefined, ProviderOffer['kind']][] = [
    [group.flatrate, 'stream'],
    [group.free, 'free'],
    [group.ads, 'free'],
    [group.rent, 'rent'],
    [group.buy, 'buy'],
  ];

  for (const [list, kind] of buckets) {
    for (const provider of list ?? []) {
      if (seen.has(provider.provider_id)) continue;
      seen.add(provider.provider_id);
      offers.push({ provider, kind });
    }
  }

  return { offers, link: group.link };
}

export function isUpcoming(dateString: string, now = Date.now()): boolean {
  if (!dateString) return false;
  const released = new Date(`${dateString}T00:00:00`).getTime();
  return Number.isFinite(released) && released > now;
}
