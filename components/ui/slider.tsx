"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface EditableSliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  valueSuffix?: string;
}

export function EditableSlider({ label, min = 0, max = 100, step = 1, value, onChange, valueSuffix = "" }: EditableSliderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      {label && <label style={{ minWidth: 60 }}>{label}</label>}
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={v => onChange(v[0])}
        className="flex-1"
      />
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={e => {
            let v = Number(e.target.value);
            if (v < min) v = min;
            if (v > max) v = max;
            onChange(v);
          }}
          style={{
            width: 70, // wide enough for 5 characters
            textAlign: "center",
            border: "1px solid #eee",
            borderRadius: 8,
            fontSize: 14,
            padding: "2px 0",
          }}
        />
        <span style={{ marginLeft: 2 }}>{valueSuffix}</span>
      </div>
    </div>
  );
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200">
      <SliderPrimitive.Range className="absolute h-full bg-orange-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-orange-500 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
