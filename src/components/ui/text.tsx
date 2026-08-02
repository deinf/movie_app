import { Text, useWindowDimensions, type TextProps, type TextStyle } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

type Variant = keyof typeof Typography;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'rating' | 'inverse';

const TONES: Record<Tone, string> = {
  primary: Colors.text,
  secondary: Colors.textSecondary,
  tertiary: Colors.textTertiary,
  accent: Colors.primaryLight,
  rating: Colors.rating,
  inverse: Colors.background,
};

const MAX_SCALE: Partial<Record<Variant, number>> = {
  micro: 1.3,
  caption: 1.4,
};
const DEFAULT_MAX_SCALE = 1.8;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'primary', style, ...rest }: AppTextProps) {
  const { fontScale } = useWindowDimensions();
  const base = Typography[variant];
  const cap = MAX_SCALE[variant] ?? DEFAULT_MAX_SCALE;
  const effectiveScale = Math.min(fontScale, cap);

  return (
    <Text
      maxFontSizeMultiplier={cap}
      style={[
        base as TextStyle,
        { color: TONES[tone], lineHeight: base.lineHeight * effectiveScale },
        style,
      ]}
      {...rest}
    />
  );
}
