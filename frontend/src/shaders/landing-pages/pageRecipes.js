import { ONEST, INSTRUMENT_SERIF, NEWSREADER, GEIST } from "./pageTypography";

const n = (val) => Number(val.toFixed(3));
const px = (val) => `${n(val)}px`;

export const KAGE_TYPOGRAPHY = {
  headingFonts: [ONEST, INSTRUMENT_SERIF, NEWSREADER, GEIST],
  bodyFonts: [ONEST, GEIST, NEWSREADER, INSTRUMENT_SERIF],
  headingWeights: ["400", "500", "600", "700"],
  headingWeight: "400",
  bodyWeights: ["300", "400", "500", "600"],
  bodyWeight: "300",
  primaryColor: "#e0231c",
  headingSize: [30, 46, 72],
  bodySize: [13, 17, 24],
  headingLetterSpacing: [-0.06, -0.012, 0.12],
  css: (type) => `
    :root {
      --vermilion: ${type.primary};
      --ember: #ff5a3c;
    }
    body { font-family: ${type.body}; }
    body, .body, .body-lg, .num { font-weight: ${type.bodyWeight}; }
    h1:not(.jp), h2:not(.jp), h3:not(.jp), .display:not(.jp) {
      font-family: ${type.heading};
      font-weight: ${type.headingWeight};
    }
    .display { letter-spacing: ${type.headingLetterSpacing}em; }
    .h-hero { font-size: clamp(26px, 3.05vw, ${px(type.headingSize)}); }
    .h-sec { font-size: clamp(30px, 4vw, ${px((type.headingSize * 60) / 46)}); }
    .body-lg { font-size: clamp(14px, 1.02vw, ${px(type.bodySize)}); }
    .body { font-size: ${px(Math.max(11, type.bodySize - 3))}; }
  `,
};
