import {
  formatRuntime,
  imageUrl,
  isUpcoming,
  mediaTitle,
  mediaYear,
  pickTrailer,
  providersForRegion,
  sortVideos,
  type Media,
  type Provider,
  type Video,
} from '@/api/tmdb';

const video = (overrides: Partial<Video>): Video => ({
  id: overrides.key ?? 'id',
  key: 'key',
  name: 'name',
  site: 'YouTube',
  type: 'Clip',
  official: false,
  published_at: '2020-01-01T00:00:00.000Z',
  ...overrides,
});

describe('imageUrl', () => {
  it('builds a sized TMDB URL', () => {
    expect(imageUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });

  it('returns null for missing artwork so callers can render a placeholder', () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl('')).toBeNull();
  });
});

describe('formatRuntime', () => {
  it('splits into hours and minutes', () => {
    expect(formatRuntime(152)).toBe('2h 32m');
  });

  it('omits the hour part under an hour', () => {
    expect(formatRuntime(45)).toBe('45m');
  });

  it('treats missing or zero runtime as unknown', () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(undefined)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});

describe('media title and year helpers', () => {
  it('reads movie fields', () => {
    const movie = { title: 'Dune', release_date: '2021-09-15' } as Media;
    expect(mediaTitle(movie)).toBe('Dune');
    expect(mediaYear(movie)).toBe('2021');
  });

  it('falls back to the TV field names', () => {
    const show = { name: 'Severance', first_air_date: '2022-02-18' } as Media;
    expect(mediaTitle(show)).toBe('Severance');
    expect(mediaYear(show)).toBe('2022');
  });

  it('never renders "undefined" as a title', () => {
    expect(mediaTitle({} as Media)).toBe('Untitled');
    expect(mediaYear({} as Media)).toBe('');
  });
});

describe('sortVideos', () => {
  it('puts trailers ahead of clips regardless of upload order', () => {
    const sorted = sortVideos([
      video({ key: 'clip', type: 'Clip' }),
      video({ key: 'trailer', type: 'Trailer' }),
    ]);
    expect(sorted.map((item) => item.key)).toEqual(['trailer', 'clip']);
  });

  it('prefers official uploads within the same type', () => {
    const sorted = sortVideos([
      video({ key: 'fan', type: 'Trailer', official: false }),
      video({ key: 'official', type: 'Trailer', official: true }),
    ]);
    expect(sorted[0].key).toBe('official');
  });

  it('breaks remaining ties by newest first', () => {
    const sorted = sortVideos([
      video({ key: 'old', type: 'Trailer', official: true, published_at: '2019-01-01T00:00:00.000Z' }),
      video({ key: 'new', type: 'Trailer', official: true, published_at: '2023-01-01T00:00:00.000Z' }),
    ]);
    expect(sorted[0].key).toBe('new');
  });

  it('drops anything not hosted on YouTube, since the player only handles those', () => {
    const sorted = sortVideos([video({ key: 'vimeo', site: 'Vimeo', type: 'Trailer' })]);
    expect(sorted).toEqual([]);
  });

  it('does not mutate the input', () => {
    const input = [video({ key: 'clip', type: 'Clip' }), video({ key: 'trailer', type: 'Trailer' })];
    sortVideos(input);
    expect(input.map((item) => item.key)).toEqual(['clip', 'trailer']);
  });
});

describe('pickTrailer', () => {
  it('returns the best-ranked video', () => {
    expect(
      pickTrailer([video({ key: 'clip', type: 'Clip' }), video({ key: 'trailer', type: 'Trailer' })])?.key,
    ).toBe('trailer');
  });

  it('returns undefined when there is nothing playable', () => {
    expect(pickTrailer([])).toBeUndefined();
    expect(pickTrailer(undefined)).toBeUndefined();
  });
});

describe('providersForRegion', () => {
  const provider = (id: number, name: string): Provider => ({
    provider_id: id,
    provider_name: name,
    logo_path: `/${id}.jpg`,
    display_priority: id,
  });

  const groups = {
    US: {
      link: 'https://example.test/us',
      flatrate: [provider(1, 'Netflix')],
      rent: [provider(1, 'Netflix'), provider(2, 'Apple TV')],
      buy: [provider(3, 'Prime Video')],
    },
    ID: { flatrate: [provider(4, 'Vidio')] },
  };

  it('returns only the requested region', () => {
    expect(providersForRegion(groups, 'ID').offers.map((offer) => offer.provider.provider_name)).toEqual([
      'Vidio',
    ]);
  });

  it('lists a service once, under its best offer type', () => {
    const { offers } = providersForRegion(groups, 'US');
    const netflix = offers.filter((offer) => offer.provider.provider_id === 1);
    expect(netflix).toHaveLength(1);
    expect(netflix[0].kind).toBe('stream');
  });

  it('orders streaming ahead of rent and buy', () => {
    expect(providersForRegion(groups, 'US').offers.map((offer) => offer.kind)).toEqual([
      'stream',
      'rent',
      'buy',
    ]);
  });

  it('passes through the region link', () => {
    expect(providersForRegion(groups, 'US').link).toBe('https://example.test/us');
  });

  it('is empty for an unavailable region or missing data', () => {
    expect(providersForRegion(groups, 'JP').offers).toEqual([]);
    expect(providersForRegion(undefined, 'US').offers).toEqual([]);
  });
});

describe('isUpcoming', () => {
  const now = new Date('2026-06-01T12:00:00Z').getTime();

  it('is true for a future release', () => {
    expect(isUpcoming('2026-12-25', now)).toBe(true);
  });

  it('is false for a past release', () => {
    expect(isUpcoming('2020-01-01', now)).toBe(false);
  });

  it('is false for a missing or unparseable date', () => {
    expect(isUpcoming('', now)).toBe(false);
    expect(isUpcoming('not-a-date', now)).toBe(false);
  });
});
