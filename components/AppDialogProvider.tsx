import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

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

const AppDialogContext = createContext<DialogApi | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const show = useCallback(
    (title: string, message: string, actions: DialogAction[], dismissible = false) =>
      new Promise<string | null>((resolve) => {
        setDialog({
          title,
          message,
          actions,
          dismissible,
          resolve,
        });
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

  const api = useMemo(
    () => ({
      alert,
      confirm,
      show,
    }),
    [alert, confirm, show]
  );

  const close = (value: string | null) => {
    if (!dialog) return;
    dialog.resolve(value);
    setDialog(null);
  };

  return (
    <AppDialogContext.Provider value={api}>
      {children}
      <Modal transparent visible={Boolean(dialog)} animationType="fade" statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (dialog?.dismissible) close(null);
            }}
          />
          <View style={styles.card}>
            <Text style={styles.title}>{dialog?.title}</Text>
            <Text style={styles.message}>{dialog?.message}</Text>
            <View style={styles.actions}>
              {dialog?.actions.map((action) => (
                <Pressable
                  key={action.key}
                  style={[
                    styles.action,
                    action.variant === "primary" && styles.actionPrimary,
                    action.variant === "danger" && styles.actionDanger,
                  ]}
                  onPress={() => close(action.key)}
                >
                  <Text
                    style={[
                      styles.actionText,
                      (action.variant === "primary" || action.variant === "danger") &&
                        styles.actionTextLight,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
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

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  action: {
    minWidth: 94,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
  },
  actionPrimary: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  actionDanger: {
    backgroundColor: "#A53B3B",
    borderColor: "#A53B3B",
  },
  actionText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  actionTextLight: {
    color: colors.background,
  },
});
