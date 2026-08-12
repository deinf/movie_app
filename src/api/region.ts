// tmdb keys its justwatch data by region and availability differs a lot between them
export function deviceRegion(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale?.split('-')[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  } catch {}
  return 'US';
}
