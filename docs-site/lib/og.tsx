import { ImageResponse } from 'next/og';
import { appName, siteUrl } from './shared';

/**
 * The brand red, as one triple so the solid and the wash below cannot drift apart.
 *
 * This is the dark-theme `--color-fd-primary` from app/global.css, because the card is always on a
 * dark background. Kept a shade off pure red: #ff0000 on near-black vibrates and the eyebrow
 * becomes hard to read at 30px.
 */
const accentRgb = '239, 68, 68';
const accent = `rgb(${accentRgb})`;
const accentWash = `rgba(${accentRgb}, 0.18)`;
const background = '#0d0d0d';

/** 1200 wide less the 80px padding on each side. */
const contentWidth = 1040;

/**
 * Sizes the title to the space rather than letting a long one overflow.
 *
 * Satori neither shrinks text to fit nor hyphenates, so this has to hold on two fronts. The tiers
 * keep a wrapping title down to about three lines. The single-word limit matters more: a generated
 * reference title such as `SettingOnSelectedChangedAttribute` is one unbreakable 33-character word,
 * and at the tier size it ran off the right edge. 0.62em per character is a safe estimate of the
 * advance width for bold Inter at these sizes.
 */
function titleSize(title: string): number {
  const byLength =
    title.length <= 20 ? 96 : title.length <= 34 ? 80 : title.length <= 50 ? 68 : 56;

  const longestWord = title.split(/\s+/).reduce((max, word) => Math.max(max, word.length), 0);
  const byWord = Math.floor(contentWidth / Math.max(longestWord, 1) / 0.62);

  return Math.max(Math.min(byLength, byWord), 40);
}

/**
 * The card shown when a page is shared on Discord, Slack or X.
 *
 * It deliberately leaves out the page description. Every one of those services already prints the
 * title and description as text beside the image, so repeating them inside it wastes the card and
 * pushes the type down to an unreadable size.
 */
export function renderOGImage({ title, eyebrow }: { title: string; eyebrow: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: background,
          color: 'white',
          padding: '80px',
          // A soft wash from the top left so the card is not a flat rectangle.
          backgroundImage: `radial-gradient(circle at 0% 0%, ${accentWash}, rgba(13,13,13,0) 55%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: titleSize(title),
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            // A backstop in case a future title defeats the estimate above.
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
          <SliderMark />
          <div style={{ display: 'flex', marginLeft: 24, fontSize: 44, fontWeight: 700 }}>
            {appName}
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 26,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {siteUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 40,
            height: 10,
            borderRadius: 999,
            backgroundColor: accent,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

/**
 * Three slider rows, drawn with plain boxes.
 *
 * Satori's SVG support is partial, so the mark is built from divs to be certain it renders.
 */
function SliderMark() {
  const rows = [
    { width: 64, knob: 40 },
    { width: 64, knob: 12 },
    { width: 64, knob: 26 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', width: row.width }}>
          <div
            style={{
              display: 'flex',
              width: row.width,
              height: 6,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              marginLeft: row.knob,
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: accent,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The label above the title, taken from the section a page sits in.
 *
 * These match the section headings in `content/docs/meta.json`. A page that is not in one of those
 * folders falls back to the generic label.
 */
export function sectionLabel(slugs: string[]): string {
  switch (slugs[0]) {
    case 'guides':
      return 'Guide';
    case 'xml':
      return 'Settings in XML';
    case 'csharp':
      return 'Settings in C#';
    case 'reference':
      return 'API Reference';
    default:
      return 'Documentation';
  }
}
