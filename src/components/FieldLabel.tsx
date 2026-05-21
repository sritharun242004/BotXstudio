import InfoTooltip from "./InfoTooltip";

interface FieldLabelProps {
  htmlFor?: string;
  label: string;
  info?: string;
}

export default function FieldLabel({ htmlFor, label, info }: FieldLabelProps) {
  return (
    <div className="labelRow">
      <label htmlFor={htmlFor}>{label}</label>
      {info && <InfoTooltip text={info} />}
    </div>
  );
}
