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
      <View style={horizontal && styles.content}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.location}>{location}</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    marginRight: 12,
    padding: 10,
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
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
