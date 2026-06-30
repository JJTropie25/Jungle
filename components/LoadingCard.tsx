import { StyleSheet, Text, View } from 'react-native';
import BrandedLoader from './BrandedLoader';
import { useTheme } from '../lib/theme-context';

type Props = {
  size?: number;
  topSpacing?: number;
  label?: string;
};

export default function LoadingCard({ size = 72, topSpacing = 60, label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.outer, { marginTop: topSpacing }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <BrandedLoader size={size} />
        {label ? (
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
  },
  card: {
    borderRadius: 22,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
