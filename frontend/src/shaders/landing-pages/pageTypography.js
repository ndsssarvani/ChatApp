import { useMemo } from "react";

export const INSTRUMENT_SERIF = {
  value: "instrument-serif",
  label: "Instrument Serif",
  stack: '"Instrument Serif", Georgia, serif',
  google: "Instrument+Serif",
};

export const NEWSREADER = {
  value: "newsreader",
  label: "Newsreader",
  stack: '"Newsreader", Georgia, serif',
  google: "Newsreader:wght@200..700",
};

export const GEIST = {
  value: "geist",
  label: "Geist",
  stack: '"Geist", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  google: "Geist:wght@100..900",
};

export const ONEST = {
  value: "onest",
  label: "Onest",
  stack: "'Onest', system-ui, -apple-system, 'Helvetica Neue', sans-serif",
  google: "Onest:wght@300;400;500;600;700",
};

function selectFont(value, options) {
  return options?.find((option) => option.value === value) ?? options?.[0] ?? ONEST;
}

function selectWeight(value, options, fallback) {
  return options?.includes(value) ? value : fallback;
}

export function splitTypographyProps(props) {
  const {
    headingFont,
    bodyFont,
    headingWeight,
    bodyWeight,
    primaryColor,
    headingSize,
    bodySize,
    headingLetterSpacing,
    ...rest
  } = props;
  const type = {
    headingFont,
    bodyFont,
    headingWeight,
    bodyWeight,
    primaryColor,
    headingSize,
    bodySize,
    headingLetterSpacing,
  };
  return [type, rest];
}

export function usePageTypography(recipe, props) {
  const {
    headingFont,
    bodyFont,
    headingWeight,
    bodyWeight,
    primaryColor = recipe?.primaryColor || "#e0231c",
    headingSize,
    bodySize,
    headingLetterSpacing,
  } = props || {};

  return useMemo(() => {
    const heading = selectFont(headingFont, recipe?.headingFonts || [ONEST]);
    const body = selectFont(bodyFont, recipe?.bodyFonts || [ONEST]);
    const primary = primaryColor || recipe?.primaryColor || "#e0231c";

    const type = {
      heading: heading.stack,
      body: body.stack,
      headingWeight: selectWeight(headingWeight, recipe?.headingWeights, recipe?.headingWeight || "400"),
      bodyWeight: selectWeight(bodyWeight, recipe?.bodyWeights, recipe?.bodyWeight || "300"),
      primary,
      headingSize: headingSize ?? recipe?.headingSize?.[1] ?? 46,
      bodySize: bodySize ?? recipe?.bodySize?.[1] ?? 17,
      headingLetterSpacing: headingLetterSpacing ?? recipe?.headingLetterSpacing?.[1] ?? -0.012,
    };

    return {
      css: recipe?.css ? recipe.css(type) : "",
      type,
    };
  }, [recipe, headingFont, bodyFont, headingWeight, bodyWeight, primaryColor, headingSize, bodySize, headingLetterSpacing]);
}
