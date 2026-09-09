# Versa Design System

Direction: Warm executive stationery — cream surfaces, amber accent, restrained palette. Professional but not cold. Feels like fine paper, not a spreadsheet.

Depth: Borders primary, subtle shadows for elevated cards only.
Spacing: 4px base (Tailwind default). Horizontal padding `px-4`. Sections separated by `mt-6`.

---

## Color Tokens

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `versa-bg` | `#F5F3EF` | Page background |
| `versa-surface` | `#FAF9F6` | Input backgrounds, secondary surfaces |
| `versa-hover` | `#F9F5EE` | Press/hover states on ghost elements |
| `versa-muted` | `#EDEAE4` | Disabled backgrounds, skeleton loaders |

### Primary Accent
| Token | Value | Usage |
|-------|-------|-------|
| `amber` | `#D4930D` | Primary buttons, active states, links |
| `amber-light` | `#F0B429` | Secondary amber (reminder icons) |
| `amber-wash` | `#FFF3D4` | Amber tinted backgrounds |
| `amber-dim` | `#FEF7E0` | Lighter amber tint |

### Semantic Colors
Each has a `DEFAULT` and `-light` (tinted background) variant.

| Token | Value | Meaning |
|-------|-------|---------|
| `coral` / `coral-light` | `#E8553D` / `#FFF0ED` | Destructive, urgent, errors |
| `sage` / `sage-light` | `#5B8C5A` / `#EDF5ED` | Success, done, calls |
| `sky` / `sky-light` | `#3B82C4` / `#EBF3FB` | Info, in-progress, email |
| `plum` / `plum-light` | `#7C5CBA` / `#F3EFFE` | AI features, highlights |

### Typography Colors
| Token | Value | Usage |
|-------|-------|-------|
| `ink` | `#1A1815` | Primary text, headings |
| `ink-body` | `#3D3A35` | Body text |
| `ink-secondary` | `#7A756D` | Secondary/supporting text |
| `ink-muted` | `#B0AAA0` | Placeholder, disabled, timestamps |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `warm-border` | `#E5E1DA` | Standard card/component borders |
| `warm-border-strong` | `#D1CBC2` | Emphasized borders |
| `warm-divider` | `#EBE8E2` | In-card list separators |

---

## Typography

Font stack: **DM Sans** (body) + **JetBrains Mono** (code/timestamps).

| Class | Font | Usage |
|-------|------|-------|
| `font-display` | DMSans_700Bold | Page titles, large numbers |
| `font-body` | DMSans_400Regular | Body text, descriptions |
| `font-body-medium` | DMSans_500Medium | Subtle emphasis, links |
| `font-body-semibold` | DMSans_600SemiBold | Card titles, button labels |
| `font-body-bold` | DMSans_700Bold | Section headers, strong emphasis |
| `font-mono` | JetBrainsMono_400Regular | Timestamps, codes |

### Text Hierarchy
- **Page title**: `text-3xl font-display tracking-tight text-ink`
- **Section header**: `text-xs font-body-bold uppercase tracking-widest text-ink-muted`
- **Card title**: `text-base font-body-semibold text-ink`
- **Body**: `text-base font-body text-ink-secondary`
- **Caption**: `text-xs font-body text-ink-muted`
- **Link / count**: `text-sm font-body-medium text-amber`

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-2xl` | 14px | Cards, containers |
| `rounded-xl` | 10px | Buttons (md/lg), inputs |
| `rounded-lg` | 8px | Buttons (sm) |
| `rounded-full` | 9999px | Badges, pills, avatars, pill CTAs |
| `rounded-md` | 6px | Rectangular priority badges |

---

## Shadows

Shadows are restrained. Most components use borders for definition.

```
// Default card
shadowColor: '#1A1815'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.06
shadowRadius: 3

// Elevated card (briefing, featured)
shadowColor: '#1A1815'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 8

// Accent glow (current calendar event)
shadowColor: '#D4930D'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.1
shadowRadius: 12
```

---

## Components

### Card
White background, warm border, optional subtle shadow.
```
base: rounded-2xl bg-white p-5 border border-warm-border
```
Variants: `default` (light shadow), `elevated` (stronger shadow), `outlined` (strong border, no shadow).

### Button
| Variant | Style |
|---------|-------|
| `primary` | `bg-amber text-white` |
| `secondary` | `border border-warm-border bg-transparent text-ink` |
| `ghost` | `bg-transparent text-ink, active:bg-versa-hover` |
| `destructive` | `bg-coral text-white` |

Sizes: `sm` (h-9 rounded-lg), `md` (h-11 rounded-xl), `lg` (h-13 rounded-xl).
Pill CTA variant: `rounded-full bg-amber px-4 py-2` for inline actions.

### Badge
Pill shape: `rounded-full px-2.5 py-0.5`.
Priority mapping:
- urgent: `bg-coral-light text-coral`
- high: `bg-amber-wash text-amber`
- medium: `bg-sky-light text-sky`
- low: `bg-versa-muted text-ink-secondary`

Rectangular badge (task cards): `rounded-md border px-2 py-0.5` with tinted bg and matching border.

### Input
```
h-12 rounded-xl border border-warm-border bg-versa-surface px-4 text-base text-ink
```
Error state swaps border to `border-coral`. Label above: `text-sm font-medium text-ink-body`.

### Avatar
Initials-based with deterministic color from name hash. Colors cycle: amber, sky, sage, plum, coral, amber-light.
Sizes: `sm` (h-8 w-8), `md` (h-10 w-10), `lg` (h-14 w-14), `xl` (h-16 w-16).
Optional ring: `border-2 border-amber/30 p-0.5`.

### Icon Container
Small icon in a tinted background square/circle.
```
h-7 w-7 items-center justify-center rounded-full bg-{semantic}-light/wash
```
Larger: `h-8 w-8 rounded-lg` or `h-9 w-9 rounded-xl`.

### Skeleton
Animated opacity pulse (0.3 to 0.7, 800ms). Uses `bg-versa-muted`.

### Empty State
Centered layout: large icon (40px, `ink-muted` color), title in `font-body-semibold`, description in `font-body text-ink-muted`.

---

## Patterns

### Section Layout
```
<View className="mt-6 px-4">
  <View className="flex-row items-center justify-between">
    <Text className="text-xs font-body-bold uppercase tracking-widest text-ink-muted">
      Section Title
    </Text>
    <Text className="text-sm font-body-medium text-amber">
      {count} items
    </Text>
  </View>
  {/* Content below with mt-3 */}
</View>
```

### List in Card
Items inside a card separated by `mx-4 border-b border-warm-divider`. Card has `p-0 overflow-hidden`.

### "See All" Link
Below card: `mt-2.5 self-center text-sm font-body-medium text-amber`.

### Quick Action Pills
Horizontal scroll of: `h-10 rounded-full border border-warm-border bg-white px-4` with icon + label.

### Calendar Carousel
Horizontal snap scroll (`snapToInterval`). Current event gets amber tint and glow shadow. Others get standard card treatment.

### Touch Feedback
Use `AnimatedPress` wrapper: spring scale to 0.97 (default) or 0.96-0.98.
```
<AnimatedPress scaleDown={0.98} onPress={...}>
```

### Decorative Orbs
Ambient background circles at 5-7% opacity. Per-screen color variants. Placed off-edge with `position: absolute`.

### Tab Bar
Frosted glass: `BlurView` with `rgba(245, 243, 239, 0.75)` tint. No top border. Active indicator: small amber dot below icon. Label: `DMSans_600SemiBold` at 11px.

### Notification Indicators
Unread dot: `h-1.5 w-1.5 rounded-full bg-amber` inline with title.
Bell badge: `h-2 w-2 rounded-full bg-coral border border-white` positioned absolute.

---

## Do / Don't

**Do:**
- Use warm-border for standard containers, warm-divider for in-card separators
- Keep shadows very subtle (0.06-0.08 opacity)
- Use semantic colors consistently (coral = urgent/error, sage = success, sky = info, plum = AI)
- Use uppercase tracking-widest for section headers
- Use AnimatedPress for all tappable cards/rows

**Don't:**
- Use dark/black backgrounds
- Use heavy drop shadows
- Use gray-toned borders (always warm)
- Mix font families within the same text block
- Use raw hex colors in components — always reference tokens
