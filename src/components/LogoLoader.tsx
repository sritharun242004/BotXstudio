type Props = {
  size?: number;
  color?: string;
  label?: string;
};

export default function LogoLoader({ size = 80, color = "currentColor", label }: Props) {
  // The animation is drawn in a 400×400 coordinate system; scale it to the desired size
  const scale = size / 400;

  return (
    <div className="logoLoaderWrap">
      <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
        <div
          className="logoLoaderInner"
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0", color }}
        >
          <div className="ll-line ll-left-vert" />
          <div className="ll-line ll-bottom-horiz" />
          <div className="ll-line ll-center-vert" />
          <div className="ll-line ll-top-horiz" />
          <div className="ll-line ll-right-vert" />
          <div className="ll-line ll-right-horiz" />
          <div className="ll-dot" />
        </div>
      </div>
      {label && <span className="logoLoaderLabel">{label}</span>}
    </div>
  );
}
