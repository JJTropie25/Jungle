import { useEffect, useRef } from "react";
import { View } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  minimumTrackTintColor?: string;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
};

export default function UISlider({
  minimumValue = 0,
  maximumValue = 1,
  step = 1,
  value = 0,
  onValueChange,
  minimumTrackTintColor = colors.textPrimary,
  onSlidingStart,
  onSlidingComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <View>
      {/* @ts-expect-error web-only input */}
      <input
        ref={inputRef}
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={value}
        onInput={(e) => onValueChange?.(Number(e.currentTarget.value))}
        onChange={(e) => onValueChange?.(Number(e.currentTarget.value))}
        onMouseDown={() => onSlidingStart?.()}
        onMouseUp={(e) =>
          onSlidingComplete?.(Number(e.currentTarget.value))
        }
        onTouchStart={() => onSlidingStart?.()}
        onTouchEnd={(e) =>
          onSlidingComplete?.(Number((e.target as HTMLInputElement).value))
        }
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
        }}
        style={{
          width: "100%",
          accentColor: minimumTrackTintColor,
          touchAction: "none",
        }}
      />
    </View>
  );
}
