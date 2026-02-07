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
}: ServiceCardProps) {
  const Container = onPress ? Pressable : View;
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
      <Image
        source={imageSource}
        style={[styles.image, horizontal && styles.imageHorizontal, imageStyle]}
      />
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
    backgroundColor: "#f3f4f6",
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
  image: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e5e7eb",
  },
  imageHorizontal: {
    width: "33%",
    height: 90,
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
});
