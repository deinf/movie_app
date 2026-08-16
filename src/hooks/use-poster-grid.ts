import { useWindowDimensions } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export interface PosterGrid {
  columns: number;
  tileWidth: number;
  gutter: number;
}

export function usePosterGrid(minTileWidth = 104, maxTileWidth = 170): PosterGrid {
  const { width } = useWindowDimensions();

  const measure = Math.min(width, MaxContentWidth);
  const gutter = Spacing.xl + (width - measure) / 2;
  const available = measure - Spacing.xl * 2;

  // as many columns as clear the minimum, then back off while tiles overshoot the max
  let columns = Math.max(3, Math.floor((available + Spacing.md) / (minTileWidth + Spacing.md)));
  while (columns < 12 && (available - Spacing.md * (columns - 1)) / columns > maxTileWidth) {
    columns += 1;
  }

  const tileWidth = Math.floor((available - Spacing.md * (columns - 1)) / columns);
  return { columns, tileWidth, gutter };
}

export function useStillGrid(minTileWidth = 150, maxTileWidth = 320): PosterGrid {
  const { width } = useWindowDimensions();

  const measure = Math.min(width, MaxContentWidth);
  const gutter = Spacing.xl + (width - measure) / 2;
  const available = measure - Spacing.xl * 2;

  let columns = Math.max(2, Math.floor((available + Spacing.md) / (minTileWidth + Spacing.md)));
  while (columns < 8 && (available - Spacing.md * (columns - 1)) / columns > maxTileWidth) {
    columns += 1;
  }

  const tileWidth = Math.floor((available - Spacing.md * (columns - 1)) / columns);
  return { columns, tileWidth, gutter };
}
