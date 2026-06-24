import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme-context";
import { type ThemeColors } from "../lib/theme";

type Props = {
  placeholder: string;
  value: string;
  mode: "date" | "time";
  onChange: (value: string) => void;
  fieldStyle?: ViewStyle;
  textColor?: string;
  placeholderColor?: string;
  label?: string;
  accentColor?: string;
};

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textPrimary,
    },
    fieldHint: {
      fontSize: 14,
      color: c.textMuted,
    },
    field: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: c.background,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    label: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    placeholder: {
      color: c.textMuted,
      fontWeight: "600",
    },
    fsHeader: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    fsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    fsCloseBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    fsHeaderTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    fsMonthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    fsMonthLabel: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    fsBody: {
      flex: 1,
      backgroundColor: c.background,
      padding: 16,
    },
    navButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    navButtonDisabled: {
      opacity: 0.45,
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    weekLabel: {
      width: "14.28%",
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.28%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    dayLabel: {
      color: c.textPrimary,
      fontWeight: "600",
      fontSize: 15,
    },
    dayCellDisabled: {
      opacity: 0.35,
    },
    dayLabelDisabled: {
      color: c.textMuted,
    },
    timePicker: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    timeTitle: {
      fontWeight: "600",
      color: c.textPrimary,
      marginBottom: 24,
      fontSize: 16,
    },
    timeColumns: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      zIndex: 1,
    },
    timeWheelWrap: {
      position: "relative",
      alignSelf: "center",
    },
    timeWheelBox: {
      position: "relative",
      width: 82,
      height: 156,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: c.background,
    },
    timeWheel: {
      height: "100%",
      width: "100%",
      backgroundColor: "transparent",
      zIndex: 2,
    },
    timeWheelContent: {
      paddingVertical: 52,
    },
    timeWheelItem: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: "transparent",
      zIndex: 3,
    },
    timeSeparator: {
      fontSize: 20,
      fontWeight: "600",
      color: c.textPrimary,
    },
    timeLabel: {
      color: "#111111",
      fontWeight: "600",
    },
    timeCenterHighlight: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: c.surfaceSoft,
      zIndex: 1,
    },
    done: {
      marginTop: 32,
      alignSelf: "center",
      paddingVertical: 13,
      paddingHorizontal: 48,
      borderRadius: 10,
    },
    doneText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    webHiddenInput: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: "none",
    },
  });
}

export default function UIDateTimeField({
  placeholder,
  value,
  mode,
  onChange,
  fieldStyle,
  textColor,
  placeholderColor,
  label,
  accentColor,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [draftTime, setDraftTime] = useState({ h: "00", m: "00" });
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const webInputRef = useRef<HTMLInputElement | null>(null);
  const insets = useSafeAreaInsets();
  const wheelItemHeight = 52;
  const wheelRepeat = 5;
  const icon = mode === "date" ? "calendar-month" : "clock-outline";
  const headerColor = accentColor ?? colors.textPrimary;

  const selectedDate = useMemo(() => {
    if (!value || mode !== "date") return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [mode, value]);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const minutes = useMemo(() => ["00", "15", "30", "45"], []);

  const selectedTime = useMemo(() => {
    if (!value || mode !== "time") return { h: "00", m: "00" };
    const [h, m] = value.split(":");
    return {
      h: hours.includes(h) ? h : "00",
      m: minutes.includes(m) ? m : "00",
    };
  }, [hours, minutes, mode, value]);

  const cyclicHours = useMemo(
    () =>
      Array.from(
        { length: hours.length * wheelRepeat },
        (_, i) => hours[i % hours.length]
      ),
    [hours]
  );
  const cyclicMinutes = useMemo(
    () =>
      Array.from(
        { length: minutes.length * wheelRepeat },
        (_, i) => minutes[i % minutes.length]
      ),
    [minutes]
  );

  useEffect(() => {
    if (!open || mode !== "time") return;
    setDraftTime(selectedTime);
  }, [mode, open, selectedTime]);

  useEffect(() => {
    if (!open || mode !== "time") return;
    const hourIndex = hours.indexOf(draftTime.h);
    const minuteIndex = minutes.indexOf(draftTime.m);
    const centerBlock = Math.floor(wheelRepeat / 2);
    setTimeout(() => {
      hourRef.current?.scrollTo({
        y: Math.max(0, centerBlock * hours.length + hourIndex) * wheelItemHeight,
        animated: false,
      });
      minuteRef.current?.scrollTo({
        y: Math.max(0, centerBlock * minutes.length + minuteIndex) * wheelItemHeight,
        animated: false,
      });
    }, 0);
  }, [draftTime.h, draftTime.m, hours, minutes, mode, open]);

  const monthLabel = useMemo(() => {
    const month = viewDate.toLocaleString("default", { month: "long" });
    return `${month} ${viewDate.getFullYear()}`;
  }, [viewDate]);

  const todayStart = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const currentMonthStart = useMemo(
    () => new Date(todayStart.getFullYear(), todayStart.getMonth(), 1),
    [todayStart]
  );

  const prevMonthDisabled =
    new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1) <
    currentMonthStart;

  const daysGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const daysInMonth = last.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [viewDate]);

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          style={[styles.field, fieldStyle]}
          onPress={() => {
            const node = webInputRef.current;
            if (!node) return;
            const showPicker = (node as any).showPicker as (() => void) | undefined;
            if (typeof showPicker === "function") {
              (node as any).showPicker();
            } else {
              node.click();
            }
          }}
        >
          <MaterialCommunityIcons name={icon} size={18} color={textColor ?? colors.textSecondary} />
          <View style={{ flex: 1 }}>
            {label && !value ? (
              <>
                <Text style={[styles.fieldLabel, textColor ? { color: textColor } : undefined]}>
                  {label}
                </Text>
                <Text style={[styles.fieldHint, placeholderColor ? { color: placeholderColor } : undefined]}>
                  {placeholder}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.label,
                  !value && styles.placeholder,
                  value && textColor ? { color: textColor } : undefined,
                  !value && placeholderColor ? { color: placeholderColor } : undefined,
                ]}
              >
                {value || placeholder}
              </Text>
            )}
          </View>
        </Pressable>
        <input
          ref={webInputRef}
          type={mode === "date" ? "date" : "time"}
          step={mode === "time" ? 900 : undefined}
          value={value || ""}
          onChange={(e) => {
            const next = e.currentTarget.value;
            if (next) onChange(next);
          }}
          style={styles.webHiddenInput as any}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.field, fieldStyle]}>
        <Pressable
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
          onPress={() => {
            if (mode === "date") {
              setViewDate(selectedDate ?? new Date());
            }
            setOpen(true);
          }}
        >
          <MaterialCommunityIcons name={icon} size={18} color={textColor ?? colors.textSecondary} />
          <View style={{ flex: 1 }}>
            {label && !value ? (
              <>
                <Text style={[styles.fieldLabel, textColor ? { color: textColor } : undefined]}>
                  {label}
                </Text>
                <Text style={[styles.fieldHint, placeholderColor ? { color: placeholderColor } : undefined]}>
                  {placeholder}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.label,
                  !value && styles.placeholder,
                  value && textColor ? { color: textColor } : undefined,
                  !value && placeholderColor ? { color: placeholderColor } : undefined,
                ]}
              >
                {value || placeholder}
              </Text>
            )}
          </View>
        </Pressable>
        {value ? (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={placeholderColor ?? colors.textSecondary}
            />
          </Pressable>
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={placeholderColor ?? colors.textSecondary}
          />
        )}
      </View>

      <Modal
        visible={open}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1 }}>
          {/* Colored header */}
          <View
            style={[
              styles.fsHeader,
              { backgroundColor: headerColor, paddingTop: insets.top + 12 },
            ]}
          >
            <View style={styles.fsHeaderRow}>
              <Pressable style={styles.fsCloseBtn} onPress={() => setOpen(false)}>
                <MaterialCommunityIcons name="chevron-down" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.fsHeaderTitle}>{label || placeholder}</Text>
              <View style={{ width: 44 }} />
            </View>
            {mode === "date" && (
              <View style={styles.fsMonthNav}>
                <Pressable
                  style={[styles.navButton, prevMonthDisabled && styles.navButtonDisabled]}
                  disabled={prevMonthDisabled}
                  onPress={() => {
                    if (prevMonthDisabled) return;
                    setViewDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    );
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={22}
                    color={prevMonthDisabled ? "rgba(255,255,255,0.35)" : "#fff"}
                  />
                </Pressable>
                <Text style={styles.fsMonthLabel}>{monthLabel}</Text>
                <Pressable
                  style={styles.navButton}
                  onPress={() =>
                    setViewDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>

          {/* White body */}
          <View style={styles.fsBody}>
            {mode === "date" ? (
              <>
                <View style={styles.weekRow}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <Text key={d} style={styles.weekLabel}>
                      {d}
                    </Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {daysGrid.map((day, index) => {
                    if (!day) return <View key={index} style={styles.dayCell} />;
                    const candidate = new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth(),
                      day
                    );
                    const isPastDate = candidate < todayStart;
                    const isSelected =
                      selectedDate &&
                      selectedDate.getFullYear() === viewDate.getFullYear() &&
                      selectedDate.getMonth() === viewDate.getMonth() &&
                      selectedDate.getDate() === day;
                    return (
                      <Pressable
                        key={index}
                        disabled={isPastDate}
                        style={({ pressed }) => [
                          styles.dayCell,
                          isPastDate && styles.dayCellDisabled,
                          isSelected
                            ? { backgroundColor: headerColor, borderRadius: 18 }
                            : pressed
                            ? { backgroundColor: headerColor + "28", borderRadius: 18 }
                            : undefined,
                        ]}
                        onPress={() => {
                          onChange(formatDate(candidate));
                          setOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            isPastDate && styles.dayLabelDisabled,
                            isSelected ? { color: "#fff" } : undefined,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.timePicker}>
                <Text style={styles.timeTitle}>Select time</Text>
                <View style={styles.timeWheelWrap}>
                  <View style={styles.timeColumns}>
                    <View style={styles.timeWheelBox}>
                      <ScrollView
                        ref={hourRef}
                        style={styles.timeWheel}
                        contentContainerStyle={styles.timeWheelContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        snapToInterval={wheelItemHeight}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(e) => {
                          const offsetY = e.nativeEvent.contentOffset.y;
                          const rawIndex = Math.round(offsetY / wheelItemHeight);
                          const normalized =
                            ((rawIndex % hours.length) + hours.length) % hours.length;
                          setDraftTime((prev) => ({ ...prev, h: hours[normalized] }));
                          if (
                            rawIndex < hours.length ||
                            rawIndex > hours.length * (wheelRepeat - 1)
                          ) {
                            const centerBlock = Math.floor(wheelRepeat / 2);
                            const recentered =
                              (centerBlock * hours.length + normalized) * wheelItemHeight;
                            requestAnimationFrame(() => {
                              hourRef.current?.scrollTo({ y: recentered, animated: false });
                            });
                          }
                        }}
                      >
                        {cyclicHours.map((h, i) => (
                          <View key={`${h}-${i}`} style={styles.timeWheelItem}>
                            <Text style={styles.timeLabel}>{h}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={[styles.timeCenterHighlight, { pointerEvents: "none" }]} />
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeWheelBox}>
                      <ScrollView
                        ref={minuteRef}
                        style={styles.timeWheel}
                        contentContainerStyle={styles.timeWheelContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        snapToInterval={wheelItemHeight}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(e) => {
                          const offsetY = e.nativeEvent.contentOffset.y;
                          const rawIndex = Math.round(offsetY / wheelItemHeight);
                          const normalized =
                            ((rawIndex % minutes.length) + minutes.length) % minutes.length;
                          setDraftTime((prev) => ({ ...prev, m: minutes[normalized] }));
                          if (
                            rawIndex < minutes.length ||
                            rawIndex > minutes.length * (wheelRepeat - 1)
                          ) {
                            const centerBlock = Math.floor(wheelRepeat / 2);
                            const recentered =
                              (centerBlock * minutes.length + normalized) * wheelItemHeight;
                            requestAnimationFrame(() => {
                              minuteRef.current?.scrollTo({ y: recentered, animated: false });
                            });
                          }
                        }}
                      >
                        {cyclicMinutes.map((m, i) => (
                          <View key={`${m}-${i}`} style={styles.timeWheelItem}>
                            <Text style={styles.timeLabel}>{m}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={[styles.timeCenterHighlight, { pointerEvents: "none" }]} />
                    </View>
                  </View>
                </View>
                <Pressable
                  style={[styles.done, { backgroundColor: headerColor }]}
                  onPress={() => {
                    onChange(`${draftTime.h}:${draftTime.m}`);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
