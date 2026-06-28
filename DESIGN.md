---
name: Europa Trip App
description: Multi-user PWA for planning a 22-day Europe trip
colors:
  neutral-bg: "#F6F4F0"
  grouped-bg: "#F0EDE8"
  card-bg: "#FFFFFF"
  ink: "#2C2C2E"
  muted: "#9A9892"
  muted2: "#B8B5AE"
  border: "rgba(44,44,46,0.08)"
  separator: "rgba(44,44,46,0.1)"
  fill: "rgba(44,44,46,0.06)"
  nordic-blue: "#5B7FFF"
  forest-green: "#6BA368"
  autumn-orange: "#E8894A"
  rust-red: "#D4685A"
  lavender: "#8B7EC8"
  blush: "#E06B8A"
  fjord-teal: "#50A5A0"
  amber: "#D4A843"
  indigo: "#6B6FC0"
typography:
  display:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 4vw, 1.5rem) .. clamp(1.75rem, 6vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 3.5vw, 1.375rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(0.9375rem, 2.5vw, 1.0625rem)"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  card: "20px"
  ios: "14px"
  ios-lg: "20px"
  ios-xl: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.nordic-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
    typography: "{typography.title}"
  button-primary-active:
    backgroundColor: "{colors.nordic-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
    typography: "{typography.title}"
  button-accent:
    backgroundColor: "{colors.autumn-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
  button-outline:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.nordic-blue}"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
  button-danger:
    backgroundColor: "{colors.rust-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.nordic-blue}"
    rounded: "{rounded.ios}"
    padding: "16px 16px"
  card-default:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ios-lg}"
    padding: "0"
  modal-sheet:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ios-xl}"
    padding: "20px"
  badge-pill:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  skeleton-shimmer:
    backgroundColor: "{colors.fill}"
    rounded: "12px"
---
# Design System: Europa Trip App

## 1. Overview

**Creative North Star: "The Nordic Journal"**

A travel planning companion that feels like a beautifully kept journal — warm, precise, and personal. Every screen is designed for a thumb and a moment: glancing at today's agenda on a train platform, logging a receipt outside a museum, checking the next city's accommodation while walking to the hotel. The aesthetic is Scandinavian editorial: generous whitespace, structured grids, warm natural tones, and iOS-inspired sheet interactions that feel tactile without being heavy.

This system explicitly rejects generic SaaS corporate design, over-decorated travel apps with loud colors and playful illustrations, and the AI-generated template look. Every element earns its place through utility, not decoration.

**Key Characteristics:**
- Warm minimalism — natural linen backgrounds, soft charcoal ink, intentional whitespace
- Mobile-first PWA — designed for thumb-zone access, single-hand use, and interrupted sessions
- iOS-native feel — layered sheets, spring animations, blurred backdrops, responsive haptic-scale taps
- Editorial typography — Nunito for warm display moments, Inter for precise body reading
- Color as signal — the palette is restrained by default; accent colors carry semantic meaning (blue for actions, orange for highlights, red for urgency)

## 2. Colors

Warm natural base with restrained chroma. Neutrals carry a subtle warmth (tinted toward ochre, not gray) to feel inviting without being beige. Accent colors are used sparingly as semantic signals.

### Primary
- **Nordic Blue** (#5B7FFF): Primary actions, active tab indicators, links, and the app's accent anchor. Used on ≤20% of any screen — its rarity is the point.

### Neutral
- **Warm Linen** (#F6F4F0): Body background. The canvas. Slightly warm off-white with minimal chroma toward ochre.
- **Sand Shell** (#F0EDE8): Grouped/inset background. One step darker than the canvas for visual grouping without borders.
- **Cloud** (#FFFFFF): Card and sheet surface. Clean white for content containers.
- **Deep Slate** (#2C2C2E): Body text and primary ink. Near-black with a hint of warmth to avoid sterile gray.
- **Warm Pebble** (#9A9892): Muted body text, secondary labels, placeholders. Warm gray with enough contrast against the background.
- **Soft Clay** (#B8B5AE): Secondary muted text, version labels, tertiary information.
- **Fill** (rgba(44,44,46,0.06)): Subtle surface tint for pressed states, skeleton backgrounds, and ghost button bases.

### Semantic
- **Forest Green** (#6BA368): Success states, positive financial values, confirmed status.
- **Autumn Orange** (#E8894A): Accent calls-to-action, urgency markers (non-critical), highlight badges.
- **Rust Red** (#D4685A): Destructive actions, danger, deletion, critical alerts.
- **Amber** (#D4A843): Warnings, medium urgency, caution states.
- **Fjord Teal** (#50A5A0): Alternative accent, used sparingly in data viz.
- **Lavender** (#8B7EC8): Optional purple accent.
- **Blush** (#E06B8A): Optional pink accent.
- **Indigo** (#6B6FC0): Optional indigo accent.

### Named Rules
**The Restrained Palette Rule.** Chroma is concentrated in the semantic accent set. Neutrals carry the interface; color does the signaling, not the decorating. If a screen has more than two accent colors visible, it's wrong.

## 3. Typography

**Display Font:** Nunito (with Inter, system-ui fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Label/Mono Font:** SF Mono / SFMono-Regular (for version numbers and code)

**Character:** A warm humanist sans for display (Nunito's rounded terminals soften the interface) paired with a precise neo-grotesk for body (Inter's neutrality ensures readability at small sizes on mobile). The pairing is "friendly but efficient" — approachable like a travel companion, not casual.

### Hierarchy
- **Display** (Nunito 800, clamp(1.75rem, 6vw, 2.5rem) / 1.1, -0.02em): Page titles and hero data (the "Hoje" heading, day count, totals). Used only once per screen. `text-wrap: balance`.
- **Headline** (Nunito 700, clamp(1.125rem, 3.5vw, 1.375rem) / 1.2, -0.01em): Section headings, modal titles, day/location headers.
- **Title** (Inter 600, clamp(0.9375rem, 2.5vw, 1.0625rem) / 1.3): Card titles, component headings, button labels.
- **Body** (Inter 400, 0.9375rem / 1.45): Prose text, descriptions, attraction details, financial values. Max line length 65–75ch.
- **Label** (Inter 500, 0.8125rem / 1.3, 0.01em): Tab bar labels, badges, metadata, small stats, time estimates. Form field labels use the same size but weight 600.

### Named Rules
**The One Font Per Role Rule.** Nunito never appears as body text below 1rem. Inter never appears as a display heading above 1.5rem unless as a fallback glyph. The pairing is a deliberate contrast, not an accidental overlap.

## 4. Elevation

iOS-inspired layered elevation with subtle ambient shadows. Depth is conveyed through stacking order and card shadows, not through dark overlays or extreme blur.

### Shadow Vocabulary
- **Card shadow** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)`): Default card elevation. Soft, close, natural — like paper on a desk.
- **Elevated sheet** (`box-shadow: 0 4px 16px rgba(0,0,0,0.06), 0 16px 40px -16px rgba(0,0,0,0.12)`): Modals, sheets, and pulled-up content. Wider shadow spread signals higher z-index.
- **Tab bar** (`backdrop-filter: blur(20px)` with `background: rgba(255,255,255,0.8)`): The tab bar is a frosted surface overlaying content. No box-shadow — blur is the elevation signal.

### Named Rules
**The Flat Base Rule.** Root surfaces (body background, grouped sections) have no shadow. Shadows only appear on interactive or stacked elements (cards, modals, sheets). The ground is always flat.

## 5. Components

### Buttons
- **Shape:** Generous rounded corners (14px). Full width on mobile by default, inline on wider views.
- **Primary (Nordic Blue):** Solid fill, white text, 15px semibold, 16px vertical padding. `tap-scale` shrinks to 0.96 on press. Disabled at 40% opacity.
- **Accent (Autumn Orange):** Same shape as primary, used for standout CTAs.
- **Outline:** Fill background (6% opacity tint), Nordic Blue text. For secondary actions alongside primary buttons.
- **Danger (Rust Red):** Solid fill, white text. Destructive confirmations only.
- **Ghost:** Transparent background, Nordic Blue text. Least prominent action — used for "Cancel" or "Skip".
- **States:** No hover state on mobile. Focus ring on keyboard navigation. Active = `scale(0.96)` spring transform.

### Cards
- **Corner Style:** Generous (20px). Consistent across all card-like containers.
- **Background:** Cloud white.
- **Shadow Strategy:** Default card shadow (see Elevation). Inset variant drops shadow for embedded sections.
- **Internal Padding:** 16px (card body). List-style cards use 16px horizontal, 12px vertical per item.
- **Border:** None. Cards are defined by shadow + background, not strokes.

### Modals (Bottom Sheets)
- **Animation:** iOS sheet slide-up (320ms cubic-bezier(0.32, 0.72, 0, 1)). Overlay fades in (200ms ease-out).
- **Corner Style:** 28px top corners (responsive — becomes 20px on desktop).
- **Background:** Cloud white. Full-width on mobile, max-w-md centered on desktop.
- **Handle:** 36×6px pill (Fill background) centered at top. Hidden on desktop.
- **Close:** Circular 28px close button (×) in Fill background.
- **Backdrop:** 40% opacity black. Tappable to dismiss.
- **Scroll:** Content scrolls within max 90% viewport height. Form inputs auto-scroll into view on focus (300ms delay).

### Badges / Chips
- **Style:** Pill shape (9999px radius), tinted background at 15% opacity with matching text color.
- **Semantic variants:** Danger (red), Warning (orange), Success (green), Urgency (alta/baixa/media), and neutral (Fill bg, muted text).
- **Font:** 12px semibold, inline-flex.
- **Usage:** Priority markers, status indicators, category tags. Never used decoratively.

### Navigation (Tab Bar)
- **Style:** Fixed bottom, frosted glass (backdrop-blur-xl, 80% card opacity). 1px top separator.
- **Typography:** 11px medium weight. Neutral Color (muted) at rest, Nordic Blue active.
- **Icons:** Lucide React icons, 20×20px. Muted at rest, Nordic Blue active.
- **Badge:** Red circular notification dot on Pendências tab. 17px min size, white text, 10px semibold.
- **Touch target:** Each tab flex-1, minimum 44px height.

### Skeleton / Loading
- **Style:** Shimmer animation (1.5s ease-in-out infinite). Linear gradient sweeps from fill → separator → fill.
- **Shape:** 12px rounded for blocks, pill for skeleton pills.
- **Cards:** Mimic card structure (18px card shadow, Cloud background, 16px padding).
- **Accessibility:** `aria-hidden="true"` on all skeleton elements.

### Inputs / Fields
- **Style:** No visible border at rest. Fill background tint for the field area. 14px rounded.
- **Focus:** When focused, the parent form context signals state. No outline ring.
- **Error:** Red text for error messages. (Redux field validation pattern.)
- **Mobile:** font-size forced to 16px to prevent iOS zoom on focus.

## 6. Do's and Don'ts

### Do:
- **Do** use generous whitespace — Scandinavian editorial breathing room is the default. Let content breathe.
- **Do** keep the palette restrained. Neutral backgrounds carry the interface; accent colors are semantic signals, not decoration.
- **Do** use Nunito for display moments (headings, titles) and Inter for everything else. The pairing must be deliberate.
- **Do** use bottom sheets for all modal interactions — it's the primary interaction pattern. Consistent slide-up animation with 320ms cubic-bezier(0.32, 0.72, 0, 1).
- **Do** use `tap-scale` class on all tappable elements for haptic-like press feedback.
- **Do** maintain WCAG AA contrast: body text (#2C2C2E) on Warm Linen (#F6F4F0) = 12.4:1. Even muted text (#9A9892) on Warm Linen = 4.8:1.
- **Do** prefer list layouts over card grids for content-heavy pages. Cards are for summary/preview, not density.

### Don't:
- **Don't** use gradient text, glassmorphism, or sketchy SVG illustrations. They are AI tells and break the Nordic Journal aesthetic.
- **Don't** use border-left greater than 1px as a colored accent stripe. Use full backgrounds or nothing.
- **Don't** put Nunito in body text below 1rem. It belongs at display scale only.
- **Don't** pair `border: 1px solid X` with `box-shadow` at 16px+ blur on the same element. Pick one.
- **Don't** over-round. Cards at 20px is the maximum. Pill shape is for badges only.
- **Don't** use tiny uppercase tracked eyebrow labels above every section. One deliberate kicker is fine; an eyebrow on every section is template grammar.
- **Don't** use numbered section markers (01 / 02 / 03) as default scaffolding. Numbers only when the order carries information.
- **Don't** use hero-metric templates (big number + small label + gradient accent). That's a SaaS cliché that this app doesn't need.
- **Don't** use repeating-linear-gradient diagonal stripe backgrounds anywhere.
