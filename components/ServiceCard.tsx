import { colors } from "../lib/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
  ViewStyle,
  ImageStyle,
} from "react-native";

type ServiceCardProps = {
  title: string;
  price: string;
  location: string;
  imageSource: ImageSourcePropType;
  meta?: string;
  rating?: number | null;
  fullWidth?: boolean;
  horizontal?: boolean;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export default function ServiceCard({
  title,
  price,
  location,
  imageSource,
  meta,
  rating,
  fullWidth,
  horizontal,
  onPress,
  containerStyle,
  imageStyle,
  isFavorite,
  onToggleFavorite,
}: ServiceCardProps) {
  const Container = onPress ? Pressable : View;
  const imageWrapStyle = [
    styles.imageWrap,
    horizontal && styles.imageWrapHorizontal,
  ];
  const ratingLabel =
    typeof rating === "number" && Number.isFinite(rating)
      ? `${rating.toFixed(1)}/10`
      : null;

  return (
    <Container
      style={[
        styles.card,
        fullWidth && styles.cardFull,
        horizontal && styles.cardHorizontal,
        containerStyle,
      ]}
      onPress={onPress}
    >
      <View style={imageWrapStyle}>
        <Image
          source={imageSource}
          style={[
            styles.image,
            horizontal && styles.imageHorizontal,
            imageStyle,
          ]}
        />
        {onToggleFavorite && (
          <Pressable style={styles.favoriteButton} onPress={onToggleFavorite}>
            <MaterialCommunityIcons
              name={isFavorite ? "star" : "star-outline"}
              size={18}
              color={isFavorite ? colors.accent : colors.textPrimary}
            />
          </Pressable>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {ratingLabel ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{ratingLabel}</Text>
          </View>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.location}>{location}</Text>
      </View>
      <View style={styles.priceCorner}>
        <Text style={styles.price}>{price}</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: 170,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginRight: 12,
    padding: 10,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "rgba(111,182,154,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  cardFull: {
    width: "100%",
    marginRight: 0,
  },
  cardHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
  },
  imageWrapHorizontal: {
    width: 110,
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.border,
  },
  imageHorizontal: {
    width: "100%",
    height: 90,
    marginBottom: 0,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingBottom: 26,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  ratingBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.textPrimary,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  priceCorner: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#CFEFD9",
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(111,182,154,0.8)",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.accent,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

