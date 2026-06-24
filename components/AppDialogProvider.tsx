import { createContext, Fragment, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../lib/theme-context";
import { type ThemeColors } from "../lib/theme";

type DialogVariant = "primary" | "secondary" | "danger";

type DialogAction = {
  key: string;
  label: string;
  variant?: DialogVariant;
};

type DialogState = {
  title: string;
  message: string;
  actions: DialogAction[];
  dismissible: boolean;
  resolve: (value: string | null) => void;
};

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: DialogVariant;
};

type DialogApi = {
  alert: (title: string, message: string) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  show: (title: string, message: string, actions: DialogAction[], dismissible?: boolean) => Promise<string | null>;
};

const TEAL = "#4F9B9B";
const DANGER = "#C0392B";

const AppDialogContext = createContext<DialogApi | null>(null);

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.42)",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: c.background,
      borderRadius: 20,
      overflow: "hidden",
    },
    header: {
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: "center",
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
      textAlign: "center",
      marginBottom: 6,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textSecondary,
      textAlign: "center",
    },
    separator: {
      height: 1,
      backgroundColor: c.divider,
    },
    actions: {
      flexDirection: "row",
    },
    actionSep: {
      width: 1,
      backgroundColor: c.divider,
    },
    action: {
      flex: 1,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    actionPressed: {
      backgroundColor: c.surfaceSoft,
    },
    actionText: {
      fontSize: 15,
      fontWeight: "600",
      color: c.textSecondary,
    },
    actionTextPrimary: {
      color: TEAL,
      fontWeight: "700",
    },
    actionTextDanger: {
      color: DANGER,
      fontWeight: "700",
    },
  });
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const show = useCallback(
    (title: string, message: string, actions: DialogAction[], dismissible = false) =>
      new Promise<string | null>((resolve) => {
        setDialog({ title, message, actions, dismissible, resolve });
      }),
    []
  );

  const alert = useCallback(
    async (title: string, message: string) => {
      await show(title, message, [{ key: "ok", label: "OK", variant: "primary" }], true);
    },
    [show]
  );

  const confirm = useCallback(
    async ({
      title,
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
      confirmVariant = "danger",
    }: ConfirmOptions) => {
      const result = await show(
        title,
        message,
        [
          { key: "cancel", label: cancelText, variant: "secondary" },
          { key: "confirm", label: confirmText, variant: confirmVariant },
        ],
        true
      );
      return result === "confirm";
    },
    [show]
  );

  const api = useMemo(() => ({ alert, confirm, show }), [alert, confirm, show]);

  const close = (value: string | null) => {
    if (!dialog) return;
    dialog.resolve(value);
    setDialog(null);
  };

  return (
    <AppDialogContext.Provider value={api}>
      {children}
      <Modal transparent visible={Boolean(dialog)} animationType="fade" statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={() => { if (dialog?.dismissible) close(null); }}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>{dialog?.title}</Text>
              {Boolean(dialog?.message) && (
                <Text style={styles.message}>{dialog?.message}</Text>
              )}
            </View>
            <View style={styles.separator} />
            <View style={styles.actions}>
              {dialog?.actions.map((action, idx) => (
                <Fragment key={action.key}>
                  {idx > 0 && <View style={styles.actionSep} />}
                  <Pressable
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                    onPress={() => close(action.key)}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        action.variant === "primary" && styles.actionTextPrimary,
                        action.variant === "danger" && styles.actionTextDanger,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                </Fragment>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}
