import { useMemo, useState } from "react";
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

  const monthLabel = useMemo(() => {
    const month = viewDate.toLocaleString("default", { month: "long" });
    return `${month} ${viewDate.getFullYear()}`;
  }, [viewDate]);

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
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            {mode === "date" ? (
              <View>
                <View style={styles.modalHeader}>
                  <Pressable
                    style={styles.navButton}
                    onPress={() =>
                      setViewDate(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={20}
                      color={colors.textPrimary}
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
                    const isSelected =
                      selectedDate &&
                      selectedDate.getFullYear() === viewDate.getFullYear() &&
                      selectedDate.getMonth() === viewDate.getMonth() &&
                      selectedDate.getDate() === day;
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.dayCell,
                          isSelected && styles.daySelected,
                        ]}
                        onPress={() => {
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
                <View style={styles.timeColumns}>
                  <ScrollView
                    style={styles.timeList}
                    showsVerticalScrollIndicator={false}
                  >
                    {hours.map((h) => (
                      <Pressable
                        key={h}
                        style={[
                          styles.timeOption,
                          selectedTime.h === h && styles.timeSelected,
                        ]}
                        onPress={() => onChange(`${h}:${selectedTime.m}`)}
                      >
                        <Text
                          style={[
                            styles.timeLabel,
                            selectedTime.h === h && styles.timeLabelSelected,
                          ]}
                        >
                          {h}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <ScrollView
                    style={styles.timeList}
                    showsVerticalScrollIndicator={false}
                  >
                    {minutes.map((m) => (
                      <Pressable
                        key={m}
                        style={[
                          styles.timeOption,
                          selectedTime.m === m && styles.timeSelected,
                        ]}
                        onPress={() => onChange(`${selectedTime.h}:${m}`)}
                      >
                        <Text
                          style={[
                            styles.timeLabel,
                            selectedTime.m === m && styles.timeLabelSelected,
                          ]}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                <Pressable
                  style={styles.done}
                  onPress={() => setOpen(false)}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
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
  timeList: {
    maxHeight: 260,
  },
  timeColumns: {
    flexDirection: "row",
    gap: 12,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeSelected: {
    backgroundColor: colors.textPrimary,
  },
  timeLabel: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  timeLabelSelected: {
    color: colors.background,
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
