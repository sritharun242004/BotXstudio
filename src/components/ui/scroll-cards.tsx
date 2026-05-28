import { FC } from "react";

export interface CardItem {
  title: string;
  description: string;
  src: string;
  color: string;
  textColor: string;
}

interface CardProps extends CardItem {
  i: number;
  total: number;
}

const CARD_STYLES = `
  .bz-sc-outer {
    position: relative;
  }
  /* Each card's scroll frame — full viewport height so each card gets its own scroll beat */
  .bz-sc-wrap {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: sticky;
    top: 0;
  }
  /* Portrait card — 3:4 matches standard fashion catalog aspect ratio */
  .bz-sc-card {
    position: relative;
    width: calc(100vw - 48px);
    max-width: 340px;
    aspect-ratio: 3 / 4;
    border-radius: 22px;
    overflow: hidden;
    border: 2.5px solid #1E293B;
    box-shadow: 6px 6px 0 rgba(30, 41, 59, 0.85);
    background: #f0f0f0;
  }
  /* Image fills card at natural portrait proportions, anchored top so garment head stays visible */
  .bz-sc-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    z-index: 0;
    display: block;
  }
  /* Gradient scrim — darkens only the bottom third for legible text */
  .bz-sc-grad {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 42%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, transparent 100%);
    z-index: 1;
    pointer-events: none;
  }
  /* Subtle corner counter */
  .bz-sc-counter {
    position: absolute;
    top: 14px;
    right: 16px;
    z-index: 2;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.12em;
  }
  .bz-sc-label {
    position: absolute;
    bottom: 22px;
    left: 0;
    right: 0;
    z-index: 2;
    text-align: center;
    padding: 0 16px;
  }
  .bz-sc-chip {
    display: inline-block;
    background: #fff;
    color: #1E293B;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.04em;
    padding: 5px 18px;
    border-radius: 9999px;
    border: 2px solid #1E293B;
    box-shadow: 2px 2px 0 #1E293B;
    margin-bottom: 8px;
  }
  .bz-sc-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.84);
    font-weight: 500;
    line-height: 1.5;
  }
`;

/* Slight alternating rotations give each card a hand-placed notepad feel */
const ROTATIONS = ["-2deg", "1.5deg", "-0.8deg", "1deg"];

const Card: FC<CardProps> = ({ title, description, src, i, total }) => (
  <div className="bz-sc-wrap">
    <div
      className="bz-sc-card"
      style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
    >
      <img src={src} alt={title} className="bz-sc-img" />
      <div className="bz-sc-grad" />
      <div className="bz-sc-counter">{i + 1} / {total}</div>
      <div className="bz-sc-label">
        <div className="bz-sc-chip">{title}</div>
        <div className="bz-sc-desc">{description}</div>
      </div>
    </div>
  </div>
);

interface CardsParallaxProps {
  items: CardItem[];
}

export const CardsParallax: FC<CardsParallaxProps> = ({ items }) => (
  <>
    <style>{CARD_STYLES}</style>
    <div className="bz-sc-outer">
      {items.map((item, i) => (
        <Card key={i} {...item} i={i} total={items.length} />
      ))}
    </div>
  </>
);
