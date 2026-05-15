import { useMemo } from "react";
import { ColorPicker, parseColor } from "@ark-ui/react/color-picker";
import { PipetteIcon } from "lucide-react";

interface PrintsColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: { label: string; hex: string }[];
}

export default function PrintsColorPicker({ value, onChange, presets }: PrintsColorPickerProps) {
  const parsedColor = useMemo(() => {
    try {
      return parseColor(value || "#000000");
    } catch {
      return parseColor("#000000");
    }
  }, [value]);

  return (
    <ColorPicker.Root
      value={parsedColor}
      onValueChange={(details) => {
        try {
          onChange(details.value.toString("hex"));
        } catch {
          // skip invalid transitions
        }
      }}
      inline
    >
      <ColorPicker.Content className="pcContent">
        {/* Gradient area */}
        <ColorPicker.Area className="pcArea">
          <ColorPicker.AreaBackground className="pcAreaBg" />
          <ColorPicker.AreaThumb className="pcAreaThumb" />
        </ColorPicker.Area>

        {/* Eyedropper + hue/alpha sliders */}
        <div className="pcSliderRow">
          <ColorPicker.EyeDropperTrigger className="pcEyedropper" title="Pick color from screen">
            <PipetteIcon style={{ width: 16, height: 16 }} />
          </ColorPicker.EyeDropperTrigger>
          <div className="pcSliders">
            <ColorPicker.ChannelSlider channel="hue" className="pcSlider">
              <ColorPicker.ChannelSliderTrack className="pcHueTrack" />
              <ColorPicker.ChannelSliderThumb className="pcSliderThumb" />
            </ColorPicker.ChannelSlider>
            <ColorPicker.ChannelSlider channel="alpha" className="pcSlider">
              <ColorPicker.TransparencyGrid className="pcTransGrid" />
              <ColorPicker.ChannelSliderTrack className="pcAlphaTrack" />
              <ColorPicker.ChannelSliderThumb className="pcSliderThumb" />
            </ColorPicker.ChannelSlider>
          </div>
        </div>

        {/* Hex input */}
        <div className="pcInputRow">
          <ColorPicker.ChannelInput channel="hex" className="pcHexInput control" />
        </div>

        {/* Preset swatches */}
        <ColorPicker.SwatchGroup className="pcSwatchGrid">
          {presets.map(({ hex, label }) => (
            <ColorPicker.SwatchTrigger key={hex} value={hex} title={label} className="pcSwatchTrigger">
              <ColorPicker.Swatch value={hex} className="pcSwatch">
                <ColorPicker.SwatchIndicator className="pcSwatchCheck">✓</ColorPicker.SwatchIndicator>
              </ColorPicker.Swatch>
            </ColorPicker.SwatchTrigger>
          ))}
        </ColorPicker.SwatchGroup>
      </ColorPicker.Content>
      <ColorPicker.HiddenInput />
    </ColorPicker.Root>
  );
}
