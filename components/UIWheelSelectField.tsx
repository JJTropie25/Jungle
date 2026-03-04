import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

type Props = {
  placeholder: string;
  value: string;
  options: string[];
  icon?: string;
  onChange: (value: string) => void;
};

export default function UIWheelSelectField({
  placeholder,
  value,
  options,
  icon = "account-group-outline",
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const wheelRef = useRef<ScrollView>(null);
  const itemHeight = 52;
  const repeat = 7;
  const selected = useMemo(
    () => (value && options.includes(value) ? value : options[0]),
    [options, value]
  );
  const cyclic = useMemo(
    () =>
      Array.from({ length: options.length * repeat }, (_, i) => options[i % options.length]),
    [options]
  );

  useEffect(() => {
    if (!open) return;
    setDraftValue(selected);
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    const centerBlock = Math.floor(repeat / 2);
    const draftIndex = Math.max(0, options.indexOf(draftValue || selected));
    setTimeout(() => {
      wheelRef.current?.scrollTo({
        y: (centerBlock * options.length + draftIndex) * itemHeight,
        animated: false,
      });
    }, 0);
  }, [draftValue, itemHeight, open, options, options.length, selected]);

  if (Platform.OS === "web") {
    const nextValue = value && options.includes(value) ? value : options[0] ?? "";
    return (
      <View style={styles.field}>
        <View style={styles.webSelectWrap}>
          <select
            value={nextValue}
            onChange={(e) => onChange(e.currentTarget.value)}
            style={styles.webSelect as any}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{value || placeholder}</Text>
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.selector}>
              <ScrollView
                ref={wheelRef}
                style={styles.wheel}
                contentContainerStyle={styles.wheelContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const rawIndex = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                  const normalized = ((rawIndex % options.length) + options.length) % options.length;
                  setDraftValue(options[normalized]);
                  if (
                    rawIndex < options.length ||
                    rawIndex > options.length * (repeat - 1)
                  ) {
                    const centerBlock = Math.floor(repeat / 2);
                    const recentered = (centerBlock * options.length + normalized) * itemHeight;
                    requestAnimationFrame(() => {
                      wheelRef.current?.scrollTo({ y: recentered, animated: false });
                    });
                  }
                }}
              >
                {cyclic.map((opt, i) => (
                  <View key={`${opt}-${i}`} style={styles.row}>
                    <Text style={styles.rowText}>{opt}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={[styles.rowSelected, { pointerEvents: "none" }]} />
            </View>

            <Pressable
              style={styles.done}
              onPress={() => {
                onChange(draftValue || selected);
                setOpen(false);
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textPrimary,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 24,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    alignSelf: "center",
  },
  selector: {
    width: 96,
    height: 156,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.background,
  },
  wheel: {
    flex: 1,
    zIndex: 2,
  },
  wheelContent: {
    paddingVertical: 52,
  },
  row: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    zIndex: 3,
  },
  rowSelected: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 52,
    height: 52,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    opacity: 1,
    zIndex: 1,
  },
  rowText: {
    color: "#111111",
    fontWeight: "600",
  },
  done: {
    marginTop: 12,
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
  },
  doneText: {
    color: colors.background,
    fontWeight: "600",
  },
  webSelect: {
    borderWidth: 0,
    outlineWidth: 0,
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  webSelectWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
