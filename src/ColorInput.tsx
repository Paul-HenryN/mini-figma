import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { HexAlphaColorPicker } from "react-colorful";
import { Input } from "./components/ui/input";
import { useState, type FormEvent } from "react";
import { DEFAULT_COLOR } from "./const";

export function ColorInput({
  color = DEFAULT_COLOR,
  onColorChange = () => {},
}: {
  color?: string;
  onColorChange?: (newColor: string) => void;
}) {
  const [inputColor, setInputColor] = useState(color);

  const submit = () => {
    const formattedColor = inputColor.startsWith("#")
      ? inputColor
      : `#${inputColor}`;

    if (isValidHexAlphaColor(formattedColor)) {
      onColorChange(formattedColor);
      setInputColor(formattedColor);
    } else {
      setInputColor(color);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    submit();
  };

  const handleColorChange = (newColor: string) => {
    setInputColor(newColor);
    onColorChange(newColor);
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger
          className="size-7 rounded-sm absolute top-1 left-1"
          style={{ backgroundColor: color }}
        />
        <PopoverContent>
          <HexAlphaColorPicker color={color} onChange={handleColorChange} />
        </PopoverContent>
      </Popover>

      <form onSubmit={handleSubmit}>
        <Input
          value={inputColor}
          onChange={(e) => setInputColor(e.target.value)}
          onBlur={submit}
          className="py-0 pl-10 w-[200px] text-[1px] uppercase"
        />
      </form>
    </div>
  );
}

function isValidHexAlphaColor(color: string) {
  return /^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color);
}
