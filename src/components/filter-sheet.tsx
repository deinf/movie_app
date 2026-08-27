import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SORT_OPTIONS, type DiscoverFilters, type Genre, type SortKey } from '@/api/tmdb';
import { Chip, PrimaryButton } from '@/components/ui/buttons';
import { AppText } from '@/components/ui/text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Scrim, Spacing } from '@/constants/theme';

const RATING_STEPS = [6, 7, 8, 9] as const;

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => current - index);
}

export interface FilterSheetProps {
  visible: boolean;
  filters: DiscoverFilters;
  genres: Genre[];
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, filters, genres, onApply, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DiscoverFilters>(filters);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  const update = (patch: Partial<DiscoverFilters>) => setDraft((current) => ({ ...current, ...patch }));

  const activeSort: SortKey = draft.sortBy ?? 'popularity.desc';
  const hasFilters = Boolean(draft.genreId || draft.minRating || draft.year || draft.sortBy);

  const showResults = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <PressableScale
          onPress={onClose}
          scaleTo={1}
          accessibilityRole="button"
          accessibilityLabel="Dismiss filters without applying"
          style={styles.backdropTouch}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.header}>
            <AppText variant="section">Filters</AppText>
            <PressableScale
              onPress={onClose}
              scaleTo={0.88}
              tapSize={{ width: 32, height: 32 }}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={styles.closeButton}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Group title="Sort by">
              {SORT_OPTIONS.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  selected={activeSort === option.key}
                  onPress={() => update({ sortBy: option.key })}
                />
              ))}
            </Group>

            <Group title="Genre">
              <Chip
                label="Any"
                selected={draft.genreId === undefined}
                onPress={() => update({ genreId: undefined })}
              />
              {genres.map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  selected={draft.genreId === genre.id}
                  onPress={() => update({ genreId: draft.genreId === genre.id ? undefined : genre.id })}
                />
              ))}
            </Group>

            <Group title="Minimum rating">
              <Chip
                label="Any"
                selected={!draft.minRating}
                onPress={() => update({ minRating: undefined })}
              />
              {RATING_STEPS.map((rating) => (
                <Chip
                  key={rating}
                  label={`${rating}+`}
                  selected={draft.minRating === rating}
                  onPress={() => update({ minRating: draft.minRating === rating ? undefined : rating })}
                />
              ))}
            </Group>

            <Group title="Release year">
              <Chip label="Any" selected={!draft.year} onPress={() => update({ year: undefined })} />
              {yearOptions().map((year) => (
                <Chip
                  key={year}
                  label={String(year)}
                  selected={draft.year === year}
                  onPress={() => update({ year: draft.year === year ? undefined : year })}
                />
              ))}
            </Group>
          </ScrollView>

          <View style={styles.footer}>
            {hasFilters ? (
              <PressableScale
                onPress={() => setDraft({})}
                scaleTo={0.96}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Reset all filters"
                style={styles.resetButton}>
                <AppText variant="caption" tone="secondary">
                  Reset
                </AppText>
              </PressableScale>
            ) : null}
            <PrimaryButton label="Show results" onPress={showResults} style={styles.applyButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="caption" tone="tertiary">
        {title}
      </AppText>
      <View style={styles.groupItems}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: Scrim.backdrop },
  backdropTouch: { flex: 1 },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  content: { gap: Spacing.xl, paddingBottom: Spacing.xl },
  group: { gap: Spacing.md },
  groupItems: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  resetButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceElevated,
  },
  applyButton: { flex: 1 },
});
