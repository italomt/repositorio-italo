# Product

## Register

product

## Users

Italo and 1-3 travel companions planning a 22-day group trip across Europe (September 14 – October 5, 2026). All users access the same shared data — there is no per-user split of expenses or itineraries. They use the app on mobile primarily (iOS Safari as PWA), occasionally on desktop for setup tasks.

## Product Purpose

A multi-user PWA that consolidates everything needed to plan and execute a multi-city group trip: itinerary, daily agenda, attractions, expenses, pending tasks, accommodations, and document storage. Eliminates the need for spreadsheets, notes apps, and PDF folders scattered across devices. Success means the group can answer "what are we doing today, what does it cost, what's still pending?" from a single tap.

## Brand Personality

"The Nordic Journal" — Scandinavian editorial design, warm minimalism, mobile-first, iOS-native feel. Warm linen backgrounds, Nunito for display type, Inter for body, generous whitespace. Color used sparingly as semantic signals (Nordic Blue #5B7FFF for actions, Autumn Orange for highlights, Rust Red for danger). Calm, confident, organized. Not playful, not corporate.

## Anti-references

- Generic SaaS dashboards with metric-heavy cards
- Dark mode UIs (tested and rejected by the user)
- AI-template look (side-stripe borders, gradient text, glassmorphism)
- Over-designed "travel app" tropes (nautical themes, postcards, passport stamps)

## Design Principles

1. **One-tap answers.** Every screen should answer the user's primary question at a glance (what's today's agenda? what's still pending? how much have we spent?) without scrolling or tapping through modals.
2. **Information density with breathing room.** Show enough data to be useful without overwhelming. Use generous whitespace, but don't hide information behind empty space.
3. **Semantic over decorative.** Every visual choice (color, icon, spacing) should carry meaning — never decoration. Blue is always actionable, orange is always a warning/pending, green is done.
4. **Mobile-first, not mobile-only.** The app lives in the pocket during the trip but should be comfortable on desktop for pre-trip planning sessions.
5. **Shared confidence.** All data is shared — the interface should reinforce that the group is aligned, not create confusion about who booked what or what's still missing.

## Accessibility & Inclusion

- WCAG AA contrast minimum (already verified during design audit)
- Reduced motion respected via `prefers-reduced-motion` media query
- Light mode only (tested and preferred by the user)
- Touch targets minimum 44px (implemented in design audit)
- Portuguese (Brazil) as primary language
