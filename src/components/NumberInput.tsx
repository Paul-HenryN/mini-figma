import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export function NumberInput({
  value,
  onValueChange,
  className,
  max,
  min,
  placeholder,
}: {
  value?: number | "mixed";
  min?: number;
  max?: number;
  onValueChange?: (newValue: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "");

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

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={inputValue}
        className={cn("border-none", className)}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={submit}
        max={max}
        min={min}
        placeholder={placeholder}
      />
    </form>
  );
}
