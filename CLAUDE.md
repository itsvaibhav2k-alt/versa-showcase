# CLAUDE.md — Versa Design System & Component Specifications

> This file is the single source of truth for all UI components in Versa.
> Every component must follow these exact specifications. Do not improvise styles.
> When in doubt, reference this file. When building any UI element, read the relevant section FIRST.

---

## App Identity

- **Name:** Versa
- **Tagline:** AI-Powered Executive Assistant
- **Platform:** React Native (Expo) — iOS, Android, Web
- **Aesthetic:** Warm, light, confident. Notion meets Amie meets Stoic meets Linear.
- **NOT:** Cold/sterile, dark theme, generic SaaS, pastel/soft, cluttered

---

## Design References (saved in /references)

When building components, reference these apps for visual quality targets:

| Reference App | Use For | Key Takeaway |
|---------------|---------|--------------|
| Attio | Task list, checkboxes, grouped sections | Grouped "Today/Upcoming" sections, date badges, avatar stacking, completion toasts |
| Linear | Filter chips, task items, toast notifications | Restraint, whitespace, minimal borders, precision |
| Craft | Bottom sheets, action menus | Colorful icon + label rows, horizontal utility buttons |
| Stoic | Dashboard greeting, stat cards, FAB + nav | Bold greeting text, weekly streak row, side-by-side summary cards, generous whitespace |
| Spark Mail | AI summary cards, inline AI content | Purple/colored AI content blocks distinct from user content, "+ai" label pattern |
| Grok | Command/voice screen, input bar | Ambient gradient blob, mic/speaker/close input bar, "Start talking" prompt, mode selector pills |
| Pi | Onboarding, splash, brand personality | Warm cream background, bold serif hero type, illustrated hero image |

---

## Color Tokens

CRITICAL: Use these exact hex values. Do not approximate or "close enough" any color.

### Backgrounds
```
bg-deep:        #F5F4F8    // App background — cool off-white (NOT pure white, NOT gray)
bg-surface:     #EDECF1    // Sidebar, panels, secondary areas
bg-card:        #FFFFFF    // Cards, modals, elevated surfaces
bg-card-hover:  #EDEAF3    // Card hover state — cool lavender shift
bg-muted:       #E8E6EE    // Inactive chips, disabled areas, badge backgrounds
bg-lavVeil:     #F2D7EE    // Very faint velvet tint for hero/AI cards
```

### Primary Accent — Velvet
```
velvet:         #69306D    // PRIMARY BRAND COLOR — buttons, active nav, focus rings
velvet-light:   #A5668B    // Icons, highlights, secondary emphasis
velvet-wash:    #F5E8EF    // Badge backgrounds, active chip fills, table headers
velvet-dim:     #F3E8F4    // Very subtle tinted areas
```

### Secondary — Coral (urgency/errors)
```
coral:          #F95738    // Errors, urgent, missed calls, destructive (vibrant coral)
coral-light:    #FEF0EC    // Error badge backgrounds
```

### Semantic Status
```
success:        #2CA58D    // Completed, online, sent (vibrant seagrass teal)
successDim:     #E6F6F2    // Success badge backgrounds
warning:        #EE964B    // Due Today, draft, in progress (sandy amber)
warningDim:     #FDF3E8    // Warning badge backgrounds
error:          #F95738    // Overdue, missed, failed, urgent (vibrant coral)
errorDim:       #FEF0EC    // Error badge backgrounds
info:           #4A6FA5    // Meetings, Due Tomorrow, voicemail (steel blue — unchanged)
infoDim:        #EDF2F9    // Info badge backgrounds
plum:           #69306D    // AI features, Versa branding, smart suggestions
plum-light:     #F3E8F4    // AI content card backgrounds (like Spark Mail "+ai" cards)
```

### Accent Colors (for avatars, badges, visual variety)
```
seagrass:       #2CA58D    // Teal-green (doubles as success)
seagrassDim:    #E6F6F2
coral:          #F95738    // Warm red-orange (doubles as error)
coralDim:       #FEF0EC
gold:           #F4D35E    // Royal gold — use navy #0E103D for text on gold bg
goldDim:        #FDF8E6
rose:           #F46197    // Warm pink
roseDim:        #FEECF3
sandy:          #EE964B    // Sandy amber (doubles as warning)
sandyDim:       #FDF3E8
steel:          #4A6FA5    // Steel blue (doubles as info)
steelDim:       #EDF2F9
```

### Text
```
text-primary:   #0E103D    // Headings, strong labels — near-black cool
text-body:      #2D2B4E    // Body text, card content
text-secondary: #6B6889    // Metadata, timestamps, descriptions
text-muted:     #A09DB8    // Placeholders, disabled, tertiary
text-on-velvet: #FFFFFF    // White text ON velvet buttons/backgrounds
```

### Borders & Dividers
```
border:         #E2D8DC    // Card borders, input borders
border-strong:  #D1C5CC    // Focus state borders, active cards
divider:        #EDE6E8    // Section separators, horizontal rules
```

---

## Typography

### Font Loading (MUST be loaded in Expo)
```javascript
// In app config or root layout:
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
```

### Type Scale — Use EXACTLY these values
```
display-lg:     { fontSize: 36, fontWeight: '700', lineHeight: 40, fontFamily: 'DMSans_700Bold', letterSpacing: -0.5 }
display-md:     { fontSize: 28, fontWeight: '700', lineHeight: 32, fontFamily: 'DMSans_700Bold', letterSpacing: -0.3 }
heading-lg:     { fontSize: 22, fontWeight: '600', lineHeight: 28, fontFamily: 'DMSans_600SemiBold' }
heading-md:     { fontSize: 18, fontWeight: '600', lineHeight: 23, fontFamily: 'DMSans_600SemiBold' }
body-lg:        { fontSize: 16, fontWeight: '400', lineHeight: 25, fontFamily: 'DMSans_400Regular' }
body-md:        { fontSize: 14, fontWeight: '400', lineHeight: 22, fontFamily: 'DMSans_400Regular' }
body-sm:        { fontSize: 13, fontWeight: '500', lineHeight: 18, fontFamily: 'DMSans_500Medium' }
caption:        { fontSize: 11, fontWeight: '600', lineHeight: 14, fontFamily: 'DMSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }
mono-lg:        { fontSize: 20, fontWeight: '600', lineHeight: 24, fontFamily: 'JetBrainsMono_600SemiBold' }
mono-md:        { fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: 'JetBrainsMono_400Regular' }
```

---

## Spacing

Use a 4px base grid. ONLY use these values:
```
space-1:   4
space-2:   8
space-3:   12
space-4:   16
space-5:   20
space-6:   24
space-8:   32
space-10:  40
space-12:  48
```

---

## Border Radius
```
radius-sm:    6     // Badges, pills, tags
radius-md:    10    // Buttons, inputs, small cards
radius-lg:    14    // Cards, modals, dropdowns
radius-xl:    20    // Large modals, bottom sheets
radius-full:  9999  // Avatars, circular elements
```

---

## Shadows

CRITICAL: Use cool-tinted shadows (rgba with cool base), NOT pure black.

```javascript
// Card at rest (elevation-1)
shadow-card: {
  shadowColor: '#0E103D',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 2,
}

// Card on hover/press (elevation-2)
shadow-card-hover: {
  shadowColor: '#0E103D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
}

// Modals, command palette (elevation-3)
shadow-modal: {
  shadowColor: '#0E103D',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 8,
}

// FAB button
shadow-fab: {
  shadowColor: '#69306D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 6,
}
```

---

## Component Specifications

### Card (base component — used everywhere)

Reference: Attio task cards, Stoic summary cards

```javascript
// Standard card
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E2D8DC',
  borderRadius: 14,
  padding: 16,
  // Apply shadow-card styles
}

// Card with status accent (left border)
// Add to the above:
{
  borderLeftWidth: 3,
  borderLeftColor: '#69306D', // velvet for pending/follow-up
  // OR '#2CA58D' for completed
  // OR '#F95738' for urgent
}

// AI content card (like Spark Mail "+ai Summary")
{
  backgroundColor: '#F3E8F4', // plum-light
  borderWidth: 1,
  borderColor: '#E2D8DC',
  borderRadius: 14,
  padding: 16,
}

// Card hover/press state
{
  backgroundColor: '#EDEAF3', // cool lavender
  borderColor: '#D1C5CC',
  // Apply shadow-card-hover styles
}
```

IMPORTANT: Cards must have BOTH border AND shadow. Border alone looks flat. Shadow alone looks floaty. Both together = premium.

### Button

```javascript
// Primary (velvet)
{
  backgroundColor: '#69306D',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 20,
  // text: #FFFFFF, fontSize: 14, fontWeight: '600'
  // Apply shadow-card styles for subtle lift
}

// Primary pressed
{
  backgroundColor: '#52254F', // slightly darker velvet
  transform: [{ scale: 0.98 }],
}

// Secondary (outlined)
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E2D8DC',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 20,
  // text: #2D2B4E, fontSize: 14, fontWeight: '500'
}

// Ghost (no border)
{
  backgroundColor: 'transparent',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 20,
  // text: #6B6889, fontSize: 14, fontWeight: '500'
}

// Danger
{
  backgroundColor: '#FEF0EC',
  borderWidth: 1,
  borderColor: 'rgba(196, 66, 61, 0.2)',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 20,
  // text: #F95738, fontSize: 14, fontWeight: '600'
}
```

### Filter Chips

Reference: Linear filter chips (Assigned / Created / Subscribed)

```javascript
// Active chip
{
  backgroundColor: '#69306D',
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 16,
  // text: #FFFFFF, fontSize: 14, fontWeight: '600'
}

// Inactive chip
{
  backgroundColor: '#E8E6EE',
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 16,
  // text: #6B6889, fontSize: 14, fontWeight: '500'
}

// Chip pressed (inactive)
{
  backgroundColor: '#E2D8DC',
}
```

### Badge / Tag

Reference: Attio date badges, priority indicators

```javascript
// Priority badges — use semantic colors on light backgrounds
// URGENT
{ backgroundColor: '#FEF0EC', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 }
// text: { color: '#F95738', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }

// HIGH
{ backgroundColor: '#F5E8EF', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 }
// text: { color: '#69306D', fontSize: 11, fontWeight: '600' }

// MEDIUM
{ backgroundColor: '#EDF2F9', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 }
// text: { color: '#4A6FA5', fontSize: 11, fontWeight: '600' }

// LOW
{ backgroundColor: '#E8E6EE', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 }
// text: { color: '#6B6889', fontSize: 11, fontWeight: '600' }

// AI badge
{ backgroundColor: '#F3E8F4', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 }
// text: { color: '#69306D', fontSize: 11, fontWeight: '600' }
```

### Checkbox

Reference: Attio task checkboxes

```javascript
// Unchecked
{
  width: 22,
  height: 22,
  borderRadius: 11, // circle
  borderWidth: 2,
  borderColor: '#E2D8DC',
  backgroundColor: 'transparent',
}

// Checked
{
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 0,
  backgroundColor: '#2CA58D', // sage
  // White checkmark icon centered, 12px
}

// Completed task text
{
  textDecorationLine: 'line-through',
  color: '#A09DB8', // text-muted
}
```

### Input Field

```javascript
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E2D8DC',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 14,
  fontFamily: 'DMSans_400Regular',
  color: '#2D2B4E',
  // placeholder color: #A09DB8
}

// Focused
{
  borderColor: '#69306D',
  // Add outer glow via shadow:
  shadowColor: '#69306D',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
}

// Error
{
  borderColor: '#F95738',
}
```

### Avatar

```javascript
// Sizes
avatar-sm:  { width: 24, height: 24, borderRadius: 12 }
avatar-md:  { width: 32, height: 32, borderRadius: 16 }
avatar-lg:  { width: 40, height: 40, borderRadius: 20 }
avatar-xl:  { width: 48, height: 48, borderRadius: 24 }

// All avatars get a subtle border
{ borderWidth: 1, borderColor: '#E2D8DC' }

// Fallback initials — cycle gradient backgrounds based on name hash:
// Colors: ['#69306D', '#2CA58D', '#F95738', '#F4D35E', '#4A6FA5', '#F46197', '#EE964B', '#A5668B']
// Text: #FFFFFF, centered, fontSize = width * 0.4, fontWeight: '600'
```

### Bottom Tab Bar

Reference: Stoic bottom nav

```javascript
// Container
{
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E2D8DC',
  paddingBottom: 34, // safe area
  paddingTop: 8,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
}

// Tab item — inactive
// icon: 24px, color: #A09DB8
// label: fontSize: 11, color: #A09DB8, fontWeight: '500'

// Tab item — active
// icon: 24px, color: #69306D
// label: fontSize: 11, color: #69306D, fontWeight: '600'
```

### Floating Action Button (FAB)

Reference: Stoic centered FAB

```javascript
{
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#69306D',
  justifyContent: 'center',
  alignItems: 'center',
  // White microphone icon, 24px
  // Apply shadow-fab styles
  // Position: centered in tab bar, elevated above it
}

// Pressed
{
  transform: [{ scale: 0.92 }],
  backgroundColor: '#52254F',
}
```

### Toast / Snackbar

Reference: Attio "Task completed" toast, Linear "Issue created" toast

```javascript
{
  position: 'absolute',
  bottom: 100, // above tab bar
  left: 16,
  right: 16,
  backgroundColor: '#0E103D', // dark toast on light bg for contrast
  borderRadius: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  flexDirection: 'row',
  alignItems: 'center',
  // Apply shadow-modal styles
}

// Icon: left side, 20px, color per type:
//   success: #2CA58D
//   error: #F95738
//   warning: #69306D
//   info: #4A6FA5

// Message text: #FFFFFF, fontSize: 14, fontWeight: '500'
// Action text (right side): #69306D, fontSize: 14, fontWeight: '600'
```

### Bottom Sheet

Reference: Craft action sheet

```javascript
// Overlay
{
  backgroundColor: 'rgba(245, 244, 248, 0.6)', // bg-deep at 60%
  // Add backdrop blur if possible (BlurView)
}

// Sheet container
{
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  // Apply shadow-modal styles
}

// Drag handle
{
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#E2D8DC',
  alignSelf: 'center',
  marginBottom: 16,
}
```

### AI Content Block

Reference: Spark Mail "+ai Summary" card

Use this pattern whenever displaying AI-generated content (briefings, call summaries, email drafts, command responses):

```javascript
// Container
{
  backgroundColor: '#F3E8F4', // plum-light
  borderRadius: 14,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E2D8DC',
}

// AI label row
// Left: plum-colored sparkle/bolt icon (16px) + "AI Summary" in caption style (#69306D)
// Right: timestamp in body-sm (#6B6889)

// Content: body-md style (#2D2B4E)
```

### Section Header

Reference: Stoic "FRIDAY" label, Attio "Today" / "Upcoming" groups

```javascript
// Overline style (like "PRIORITY TASKS", "TODAY'S SCHEDULE")
{
  // Use caption style: fontSize 11, fontWeight 600, letterSpacing 0.5, uppercase
  color: '#A09DB8',
  marginBottom: 12,
  marginTop: 24,
}

// With count badge (like Attio "Today 3")
// Section title in heading-md + count in a small pill (bg-muted, text-secondary)
```

### Greeting / Dashboard Header

Reference: Stoic "good afternoon."

```javascript
// Greeting text
{
  // display-md: fontSize 28, fontWeight 700, bold
  color: '#0E103D',
}

// Subtitle (date or "Here's your day at a glance")
{
  // body-md: fontSize 14
  color: '#6B6889',
  marginTop: 4,
}

// Layout: greeting left-aligned, notification bell + avatar on right
// Notification bell: 24px icon in #6B6889, with optional velvet dot for unread
// Avatar: avatar-lg (40px) with velvet ring border if premium
```

### Command Screen Input Bar

Reference: Grok input bar

```javascript
// Input container
{
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E2D8DC',
  borderRadius: 28, // pill shape
  paddingVertical: 10,
  paddingHorizontal: 16,
  marginHorizontal: 16,
}

// Placeholder: "Ask Anything" in body-md, #A09DB8
// Right side icons: microphone (20px), speaker (20px), close (20px) in #6B6889
// When voice active: mic icon turns velvet, glow ring appears

// Ambient gradient blob behind (for voice mode):
// Use LinearGradient with warm velvet + light plum at low opacity (0.15-0.2)
// Blur/soften heavily
```

---

## Screen-Level Layout Rules

### General
- Screen background: ALWAYS #F5F4F8 (bg-deep)
- Content horizontal padding: 16px on mobile
- Spacing between sections: 24-32px
- Spacing between cards within a section: 8-12px

### Whitespace Philosophy (CRITICAL)
Reference: Stoic, Linear — notice how much EMPTY SPACE exists.
- Do NOT pack every pixel with content
- Leave at least 24px between major sections
- Cards should breathe — 16px internal padding minimum
- If a screen feels crowded, ADD SPACE, don't shrink elements

### Navigation
- Mobile: Bottom tab bar (5 items) + centered FAB
- Tab order: Home, Team, Calls, Command, Settings
- Active tab: velvet icon + label
- Inactive: text-muted icon + label

---

## Icon Usage

Use Lucide React Native (`lucide-react-native`) exclusively:
- Default size: 20px for nav, 24px for section headers
- Default stroke width: 1.5
- Default color: #6B6889 (text-secondary)
- Active color: #69306D (velvet) or #0E103D (text-primary)
- Semantic: #2CA58D (success), #F95738 (error), #EE964B (warning), #4A6FA5 (info)

Key icons:
- Home: `Home`
- Team: `Users`
- Calls: `Phone`
- Command: `Mic`
- Settings: `Settings`
- Add: `Plus`
- Search: `Search`
- Notification: `Bell`
- AI/Smart: `Sparkles` or `Zap`
- Check: `Check`
- Calendar: `Calendar`
- Email: `Mail`
- Filter: `SlidersHorizontal`
- Sort: `ArrowUpDown`

---

## Animation Guidelines

```javascript
// Card press
{ transform: [{ scale: 0.98 }], duration: 100, easing: 'ease-out' }

// Card list stagger
{ opacity: 0→1, translateY: 12→0, duration: 200, stagger: 40 }

// FAB press
{ transform: [{ scale: 0.92 }], duration: 100, spring back }

// Toast enter
{ translateY: 100→0, opacity: 0→1, duration: 300, spring }

// Bottom sheet
{ translateY: screenHeight→0, duration: 350, spring(1, 80, 10) }

// Tab switch indicator
{ translateX: animated, duration: 250, spring }
```

---

## DO NOT

- Use pure white (#FFFFFF) as a screen background — always use #F5F4F8
- Use pure black (#000000) for text — always use #0E103D
- Use blue as a primary accent — velvet (#69306D) is the brand color
- Mix icon libraries — Lucide only
- Skip shadows on cards — every card needs both border AND shadow
- Use System fonts — always load DM Sans and JetBrains Mono
- Make cards borderless — every card needs 1px #E2D8DC border
- Put too much content on screen — when in doubt, add whitespace
- Use gradient backgrounds on cards (except AI content blocks and voice mode)
- Approximate colors — use exact hex values from this file
