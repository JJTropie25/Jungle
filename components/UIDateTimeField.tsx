import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
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
  mode: "date" | "time";
  onChange: (value: string) => void;
};

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function UIDateTimeField({
  placeholder,
  value,
  mode,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const wheelItemHeight = 52;
  const wheelRepeat = 5;
  const icon = mode === "date" ? "calendar-month" : "clock-outline";
  const selectedDate = useMemo(() => {
    if (!value || mode !== "date") return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [mode, value]);
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const minutes = useMemo(
    () => ["00", "15", "30", "45"],
    []
  );
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
    const hourIndex = hours.indexOf(selectedTime.h);
    const minuteIndex = minutes.indexOf(selectedTime.m);
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
  }, [hours, minutes, mode, open, selectedTime.h, selectedTime.m]);

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
    const cells: Array<number | null> = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [viewDate]);

  return (
    <View>
      <Pressable
        style={styles.field}
        onPress={() => {
          if (mode === "date") {
            setViewDate(selectedDate ?? new Date());
          }
          setOpen(true);
        }}
      >
        <Text style={styles.label}>{value || placeholder}</Text>
        <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} />
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            {mode === "date" ? (
              <View>
                <View style={styles.modalHeader}>
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
                      size={20}
                      color={prevMonthDisabled ? colors.textMuted : colors.textPrimary}
                    />
                  </Pressable>
                  <Text style={styles.monthLabel}>{monthLabel}</Text>
                  <Pressable
                    style={styles.navButton}
                    onPress={() =>
                      setViewDate(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>
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
                        style={[
                          styles.dayCell,
                          isPastDate && styles.dayCellDisabled,
                          isSelected && styles.daySelected,
                        ]}
                        onPress={() => {
                          if (isPastDate) return;
                          const next = new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth(),
                            day
                          );
                          onChange(formatDate(next));
                          setOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            isPastDate && styles.dayLabelDisabled,
                            isSelected && styles.dayLabelSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
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
                          onChange(`${hours[normalized]}:${selectedTime.m}`);
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
                            <Text style={styles.timeLabel}>
                              {h}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View pointerEvents="none" style={styles.timeCenterHighlight} />
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
                          onChange(`${selectedTime.h}:${minutes[normalized]}`);
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
                            <Text style={styles.timeLabel}>
                              {m}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                      <View pointerEvents="none" style={styles.timeCenterHighlight} />
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.done}
                  onPress={() => {
                    onChange(`${selectedTime.h}:${selectedTime.m}`);
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
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  navButtonDisabled: {
    opacity: 0.55,
  },
  monthLabel: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekLabel: {
    width: "14.28%",
    textAlign: "center",
    color: colors.textMuted,
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
    color: colors.textPrimary,
    fontWeight: "600",
  },
  dayCellDisabled: {
    opacity: 0.45,
  },
  dayLabelDisabled: {
    color: colors.textMuted,
  },
  daySelected: {
    backgroundColor: colors.textPrimary,
    borderRadius: 18,
  },
  dayLabelSelected: {
    color: colors.background,
  },
  timeTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
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
    backgroundColor: colors.background,
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
    opacity: 1,
    zIndex: 3,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
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
    backgroundColor: colors.surfaceSoft,
    opacity: 1,
    zIndex: 1,
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
});
