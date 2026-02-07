import { View } from "react-native";
import Slider from "@react-native-community/slider/dist/Slider";

export default function UISlider(props: any) {
  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <Slider {...props} />
    </View>
  );
}
