import { ColorPicker, parseColor } from "@ark-ui/react/color-picker";
import { PipetteIcon } from "lucide-react";

interface GarmentColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: { label: string; hex: string }[];
  activePreset: string;
  onPresetClick: (hex: string) => void;
}

export default function GarmentColorPicker({
  value,
  onChange,
  presets,
  activePreset,
  onPresetClick,
}: GarmentColorPickerProps) {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div className="gcpRoot">
      <ColorPicker.Root
        value={parseColor(safeValue)}
        onValueChange={(details) => {
          const hex = details.value.toString("hex");
          onChange(hex.toUpperCase());
        }}
        inline
      >
        <ColorPicker.Content className="gcpInlineContent">
          {/* Color gradient area */}
          <ColorPicker.Area className="gcpArea">
            <ColorPicker.AreaBackground className="gcpAreaBg" />
            <ColorPicker.AreaThumb className="gcpThumb" />
          </ColorPicker.Area>

          {/* Eye dropper + hue/alpha sliders */}
          <div className="gcpSliderRow">
            <ColorPicker.EyeDropperTrigger className="gcpEyedropper" title="Pick color from screen">
              <PipetteIcon size={14} />
            </ColorPicker.EyeDropperTrigger>
            <div className="gcpSliders">
              <ColorPicker.ChannelSlider channel="hue" className="gcpSlider">
                <ColorPicker.ChannelSliderTrack className="gcpHueTrack" />
                <ColorPicker.ChannelSliderThumb className="gcpSliderThumb" />
              </ColorPicker.ChannelSlider>
              <ColorPicker.ChannelSlider channel="alpha" className="gcpSlider">
                <ColorPicker.TransparencyGrid className="gcpAlphaGrid" />
                <ColorPicker.ChannelSliderTrack className="gcpAlphaTrack" />
                <ColorPicker.ChannelSliderThumb className="gcpSliderThumb" />
              </ColorPicker.ChannelSlider>
            </div>
          </div>

          {/* Hex + alpha inputs */}
          <div className="gcpInputRow">
            <ColorPicker.ChannelInput channel="hex" className="control gcpInput" />
            <ColorPicker.ChannelInput channel="alpha" className="control gcpInputAlpha" />
          </div>
        </ColorPicker.Content>

        <ColorPicker.HiddenInput />
      </ColorPicker.Root>

      {/* Preset swatches */}
      <div className="gcpPresetsSection">
        <div className="gcpPresetsLabel">Saved Colors</div>
        <div className="gcpPresetGrid">
          {presets.map(({ label, hex }) => {
            const isActive = activePreset?.toUpperCase() === hex.toUpperCase();
            return (
              <button
                key={hex}
                type="button"
                className={`gcpPresetDot${isActive ? " gcpPresetDotActive" : ""}`}
                style={{ background: hex } as React.CSSProperties}
                onClick={() => onPresetClick(hex)}
                title={label}
              >
                {isActive && (
                  <svg viewBox="0 0 12 12" fill="none" stroke={isLightColor(hex) ? "#000" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
