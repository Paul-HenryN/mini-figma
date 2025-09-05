import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { SlidersHorizontalIcon } from "lucide-react";

export function NumberInput({
  id,
  value,
  onValueChange,
  className,
  max,
  min,
  placeholder,
  inputHandle,
}: {
  id?: string;
  value?: number | "mixed";
  min?: number;
  max?: number;
  onValueChange?: (newValue: number) => void;
  className?: string;
  placeholder?: string;
  inputHandle?: React.ReactNode;
}) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "");
  const [isSliding, setSliding] = useState(false);

  const submit = () => {
    const newValue = Number(inputValue);

    if (Number.isNaN(newValue)) {
      setInputValue(value?.toString() ?? "");
      return;
    }

    const bottom = min || 0;
    const top = max || Number.MAX_SAFE_INTEGER;

    onValueChange?.(Math.max(Math.min(newValue, top), bottom));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  useEffect(() => {
    setInputValue(value?.toString() || "");
  }, [value]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSliding) return;

    const deltaX = e.movementX;
    const step = e.shiftKey ? 10 : 1;

    if (typeof value === "number") {
      onValueChange?.(value + deltaX * step);
    }
  };

  const handleMouseUp = () => {
    setSliding(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <button
        type="button"
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-ew-resize"
        onMouseDown={() => {
          setSliding(true);
        }}
      >
        {inputHandle || <SlidersHorizontalIcon className="size-4" />}
      </button>

      <Input
        id={id}
        type="text"
        value={inputValue}
        className={cn(
          "border-0 pl-8",
          isSliding && "border border-primary",
          className
        )}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={submit}
        max={max}
        min={min}
        placeholder={placeholder}
      />
    </form>
  );
}
