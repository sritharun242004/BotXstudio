import { Nav } from "./lp/Nav";
import { LandingPageTheme } from "./lp/index";
import ReferralBanner from "./components/ReferralBanner";
import "./lp/theme.css";

export default function LandingPage() {
  return (
    <>
      <ReferralBanner />
      <Nav />
      <LandingPageTheme />
    </>
  );
}
