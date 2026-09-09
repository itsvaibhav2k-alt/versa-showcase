# E2E Test Audit & Update Plan for UI Redesign

This document audits all 19 Playwright specs and 24 Maestro flows (plus `run-all.yaml`) against the "Luxury Concierge" UI redesign plan. For each file, it identifies breaking changes, selectors to update, new assertions needed, and the wave in which the update should happen.

---

## PLAYWRIGHT SPECS (19 files)

---

### e2e/home.spec.ts
- **Breaking changes**:
  1. SummaryCards removed. Test checks `getByText(/\d+ tasks/)` and `getByText(/\d+ meetings/)` as separate card elements. These become a single StatLine: "3 tasks . 2 meetings . 1 follow-up".
  2. QuickActions simplified. Test checks `getByText('New Task')` — text changes to "+ Task" (text-only link).
  3. "Today's Schedule" label might change since CalendarSnapshot becomes a vertical timeline.
  4. "AI BRIEFING" label/heading may change with hero card redesign.
- **Selectors to update**:
  - `getByText(/\d+ tasks/)` -> `getByText(/\d+ tasks/)` (still works if StatLine keeps "tasks" text, but context changes from card to inline)
  - `getByText(/\d+ meetings/)` -> same, but both appear in one line now
  - `getByText('New Task')` -> `getByText('+ Task')` or `getByText('Task')` depending on rendering
  - `getByText(/Schedule/)` -> verify label text in vertical timeline
  - `getByText('AI BRIEFING')` -> verify new hero card label
  - `getByText('Generate Briefing')` -> verify button still exists
- **New assertions needed**:
  - StatLine component renders as single line with separator dots
  - Verify vertical timeline layout for calendar (testID `stat-line`)
  - QuickActions render as text links separated by " . "
  - AI briefing renders as hero `Card variant="ai"` with gradient border
- **Wave**: 2

---

### e2e/calls.spec.ts
- **Breaking changes**:
  1. Filter chips become UnderlineTabs. Text ("All", "Missed", "Voicemail", "Transcripts") stays the same, but the visual component changes from amber/muted pills to text tabs with underline.
  2. Call items change from full cards to FlatRows. Date grouping headers ("TODAY", "EARLIER") stay.
  3. Subtitle "Call history, transcripts & follow-ups" may change.
- **Selectors to update**:
  - `getByText('All', { exact: true })`, `getByText('Missed', ...)` etc. -- text selectors still work since tab labels stay the same
  - Filter click behavior remains the same, but underlying component changes
- **New assertions needed**:
  - Verify UnderlineTabs active underline styling (could use testID `tab-all`, `tab-missed`, etc.)
  - Verify FlatRow rendering instead of card-based items
- **Wave**: 3

---

### e2e/call-detail.spec.ts
- **Breaking changes**:
  1. Call items now FlatRows instead of cards -- clicking patterns change. The `data-testid="call-log-item"` may need to become `flat-row-call-*`.
  2. Call status text matching (`/missed|completed|voicemail/i`) changes since badges become StatusDots -- the text labels may no longer be rendered inline.
  3. AI Summary card styling changes (still plum but structure differs).
  4. Action buttons "Assign to Team" and "Create Follow-up" may become text links separated by " . ".
- **Selectors to update**:
  - `page.locator('[data-testid="call-log-item"]')` -> `[data-testid^="flat-row-call"]` or similar
  - `getByText(/missed|completed|voicemail/i)` -> may break if status becomes dots only; need testID-based selectors
  - `getByText('Assign to Team')` -> verify text still exists as link
  - `getByText('Create Follow-up')` -> verify text still exists as link
- **New assertions needed**:
  - Verify StatusDot presence on call items via testID
  - Verify expandable AI summary (tap to expand/collapse)
- **Wave**: 3

---

### e2e/team.spec.ts
- **Breaking changes**:
  1. Search bar becomes hidden by default (expandable on icon tap). `getByPlaceholder('Search team or tasks...')` will fail since it is not visible initially.
  2. Members section changes from 100px bordered cards to 64px borderless columns.
  3. Task board filter chips become UnderlineTabs.
  4. "Task Board" heading text may change.
  5. "View all" link may remain or be removed.
- **Selectors to update**:
  - `getByPlaceholder('Search team or tasks...')` -> must tap search icon first, or use testID
  - `getByText('View all')` -> verify still exists
  - `getByText(/Task/i)` -> update if heading changes
- **New assertions needed**:
  - Verify expandable search interaction (tap icon -> input appears)
  - Verify compact avatar columns for members
  - Verify UnderlineTabs on task board
- **Wave**: 3

---

### e2e/command.spec.ts
- **Breaking changes**:
  1. "Command" heading changes to "Versa". Tests check `getByText('Command')` in multiple places.
  2. Tab navigation: `getByText('Command', { exact: true })` in beforeEach changes if tab label changes to "Versa".
  3. Subtitle "Voice or text -- your AI assistant is ready" may change.
  4. Suggestion chips change from vertical full-width to horizontal scroll text pills, but text content stays the same.
  5. Empty state "Ask me anything or tap the mic" may change since voice FAB is merged into input bar.
- **Selectors to update**:
  - `getByText('Command', { exact: true })` (tab nav) -> `getByText('Versa', { exact: true })` if tab label changes
  - `getByText('Command')` (heading) -> `getByText('Versa')`
  - `getByText('Voice or text -- your AI assistant is ready')` -> new subtitle text
  - `getByText('Ask me anything or tap the mic')` -> update to match new empty state text
  - `getByPlaceholder('Ask anything...')` -> may stay the same
- **New assertions needed**:
  - Verify horizontal suggestion chip layout
  - Verify mic icon is inside input bar (not a separate FAB)
  - Verify "Clear" text link replaces bordered history button
- **Wave**: 4

---

### e2e/command-voice.spec.ts
- **Breaking changes**:
  1. "Command" heading -> "Versa". Multiple `getByText('Command')` selectors break.
  2. Tab nav `getByText('Command', { exact: true })` breaks.
  3. "Voice or text" subtitle may change.
  4. "Tap to speak" text may change since voice is now merged into input bar.
  5. "Ask me anything" text may change.
  6. Clear conversation button (Clock icon in circular container) changes to "Clear" text link.
- **Selectors to update**:
  - `getByText('Command', { exact: true })` -> `getByText('Versa', { exact: true })`
  - `getByText('Command')` -> `getByText('Versa')`
  - `getByText(/Voice or text/)` -> new subtitle
  - `getByText('Tap to speak')` -> may change to mic-in-input-bar interaction
  - `getByText(/Ask me anything/)` -> updated empty state text
- **New assertions needed**:
  - Verify mic icon within input bar toggles voice mode inline
  - Verify no standalone VoiceInput FAB exists
- **Wave**: 4

---

### e2e/settings.spec.ts
- **Breaking changes**:
  1. Profile card removed (replaced with inline header). "Edit Profile" text stays but context changes.
  2. Section cards removed. Settings rows render directly on bg-deep.
  3. "Connected" / "Not Configured" pill badges become plain colored text.
  4. Icon circles (36px colored backgrounds) become bare 20px Lucide icons.
  5. Ionicons replaced with Lucide (icon rendering changes).
- **Selectors to update**:
  - `getByText('Edit Profile')` -> still works (text stays)
  - `getByText('Preferences', { exact: true })` -> still works (section label stays)
  - `getByText('Integrations', { exact: true })` -> still works
  - `getByText('Notifications', { exact: true })` -> still works
  - `getByText('Calendar Sync')` -> still works
  - `getByText('Sign Out')` -> still works
  - `getByText('2.0.1')` -> still works
  - `getByText('Webhooks n8n')` -> still works
  - `getByText('Digest Schedule')` -> still works
- **New assertions needed**:
  - Verify no Card wrappers around settings sections
  - Verify profile rendered inline (not in elevated card)
- **Wave**: 4

---

### e2e/settings-integrations.spec.ts
- **Breaking changes**:
  1. "2 Active" badge for Email Accounts changes from pill badge to plain colored text.
  2. Profile card removal -- "show profile card with user info" test name is misleading but selector still works.
  3. Card wrappers removed from sections.
- **Selectors to update**:
  - `getByText('2 Active')` -> may still work if text is rendered as plain text, but verify
  - `getByText(/Satya|User/)` -> still works
  - `getByText('Calendar Sync')` -> still works
  - `getByText('Phone Configuration')` -> still works
  - `getByText('Sign Out')` -> still works
  - `getByText('2.0.1')` -> still works
- **New assertions needed**:
  - Verify status text renders as colored text instead of pill badge
- **Wave**: 4

---

### e2e/task-create.spec.ts
- **Breaking changes**:
  1. Priority chips ("Low", "Med", "High", "Urgent") change from colored pill badges to StatusDot + text-only label (radio style).
  2. Form sections lose Card wrappers.
  3. Cancel button changes from button to ghost text link.
  4. "Create Task" submit button stays as amber primary CTA.
  5. Navigation from home via "New Task" quick action -- button text changes to "+ Task".
- **Selectors to update**:
  - `getByText('Low', { exact: true })` -> may still work if label text is preserved alongside dot
  - `getByText('Med', { exact: true })` -> same
  - `getByText('High', { exact: true })` -> same
  - `getByText('Urgent', { exact: true })` -> same
  - `getByText('Cancel')` -> still works (ghost text link)
  - `getByText('New Task')` -> may change to `getByText('+ Task')` or similar
  - `getByPlaceholder('What needs to be done?')` -> still works
  - `getByPlaceholder('Add details...')` -> still works
  - `getByText('Create Task')` -> still works
- **New assertions needed**:
  - Verify StatusDot colors for each priority level
  - Verify caption-style labels above inputs
  - Verify increased field spacing (20px)
- **Wave**: 5

---

### e2e/task-detail.spec.ts
- **Breaking changes**:
  1. "Task Details" heading text may change.
  2. Priority badges become StatusDots.
  3. Card wrappers removed from form sections.
  4. "Go back" link styling may change.
- **Selectors to update**:
  - `getByText('Task Details')` -> verify text stays the same
  - `getByText('Task not found')` -> still works
  - `getByText('Go back')` -> still works
- **New assertions needed**:
  - Verify StatusDot for task priority
  - Verify no Card wrapper around task detail content
- **Wave**: 5

---

### e2e/all-tasks.spec.ts
- **Breaking changes**:
  1. Filter tabs ("All", "To Do", "In Progress", "Done") change from pill chips to UnderlineTabs in modal context.
  2. Task items change from cards to FlatRows.
  3. Priority badges become StatusDots.
  4. "X tasks total" count text may change format.
- **Selectors to update**:
  - `getByRole('heading', { name: 'All Tasks' })` -> still works
  - `getByText('All', { exact: true })` -> still works (UnderlineTabs keep labels)
  - `getByText('To Do', { exact: true })` -> still works
  - `getByText('In Progress', { exact: true })` -> still works
  - `getByText('Done', { exact: true })` -> still works
  - `getByText('Close')` -> still works
  - `getByText(/\d+ tasks? total/)` -> verify format unchanged
- **New assertions needed**:
  - Verify UnderlineTabs active underline
  - Verify FlatRow task items with StatusDots
- **Wave**: 5

---

### e2e/quick-actions.spec.ts
- **Breaking changes**:
  1. "New Task" button text changes -- becomes text link, likely "+ Task".
  2. "Call", "Email", "Remind" button texts may change to "Call", "Email", "Remind" as text links (possibly same text but different component).
  3. Bordered pill buttons become text-only links separated by " . ".
  4. Navigation targets stay the same (modals still open).
- **Selectors to update**:
  - `getByText('New Task')` -> `getByText('+ Task')` or `getByText('Task')`
  - `getByText('Call', { exact: true })` -> may conflict with tab bar "Calls" text
  - `getByText('Email', { exact: true })` -> still works if text preserved
  - `getByText('Remind', { exact: true })` -> still works if text preserved
- **New assertions needed**:
  - Verify text-link rendering (no borders/pills)
  - Verify "+" prefix on Task action
- **Wave**: 5

---

### e2e/email-compose.spec.ts
- **Breaking changes**:
  1. Navigation via "Email" quick action -- text may stay but component changes.
  2. Tone selector chips ("Professional", "Friendly", "Urgent") may change from colored pills to StatusDot + text or underline-style selectors.
  3. "Generate & Send" button -- stays as amber primary CTA.
  4. "Cancel" becomes ghost text link.
  5. Card wrappers removed from form sections.
- **Selectors to update**:
  - `getByText('Email')` -> still works
  - `getByText('Compose Email')` -> still works
  - `getByText('To')` -> still works
  - `getByText('Subject')` -> still works
  - `getByText(/What do you want to say/)` -> still works
  - `getByText('Professional')` -> still works (label text preserved)
  - `getByText('Friendly')` -> still works
  - `getByText('Urgent')` -> still works
  - `getByText('Generate & Send')` -> still works
  - `getByText('Cancel')` -> still works
- **New assertions needed**:
  - Verify no Card wrappers
  - Verify caption-style labels above inputs
- **Wave**: 5

---

### e2e/reminder-create.spec.ts
- **Breaking changes**:
  1. Card wrappers removed from form sections.
  2. Cancel becomes ghost text link.
  3. "Create Reminder" stays as amber primary CTA.
- **Selectors to update**:
  - All text selectors (`'New Reminder'`, `'Cancel'`, `'Create Reminder'`, placeholders) remain the same
  - No selector changes needed for this spec
- **New assertions needed**:
  - Verify caption-style labels above inputs
  - Verify no Card wrappers
- **Wave**: 5

---

### e2e/call-log-create.spec.ts
- **Breaking changes**:
  1. Direction chips ("Inbound", "Outbound") may change from colored pills to radio-style selectors with dots.
  2. Card wrappers removed from form sections.
  3. Cancel becomes ghost text link.
  4. "Log Call" stays as amber primary CTA.
- **Selectors to update**:
  - `getByText('Direction')` -> still works
  - `getByText('Inbound', { exact: true })` -> still works (label text preserved)
  - `getByText('Outbound', { exact: true })` -> still works
  - All other selectors remain the same
- **New assertions needed**:
  - Verify radio-style direction selector
  - Verify no Card wrappers
- **Wave**: 5

---

### e2e/notifications.spec.ts
- **Breaking changes**:
  1. Bell icon area changes (border removed from bell container, no shadow). Notification route navigation is via `page.goto()` so this does not break.
  2. Notification items may change from cards to FlatRows.
  3. "Read all" button may become a text link.
  4. Unread count pill may become plain text.
- **Selectors to update**:
  - `getByText('Notifications', { exact: true })` -> still works
  - `getByText('Today', { exact: true })` -> still works
  - `getByText('Earlier', { exact: true })` -> still works
  - `getByText('No notifications yet')` -> still works
  - `getByText('Read all')` -> still works
  - `getByText(/\d+ unread/)` -> still works if text preserved
- **New assertions needed**:
  - Verify FlatRow notification items
- **Wave**: 5

---

### e2e/auth.spec.ts
- **Breaking changes**:
  1. Minimal impact. Auth screens are not part of the main redesign scope.
  2. `getByText('Settings', { exact: true })` tab nav still works.
  3. `getByText('Versa')` on welcome screen still works.
- **Selectors to update**:
  - No changes needed -- auth flow is outside redesign scope
- **New assertions needed**:
  - None
- **Wave**: N/A (no update needed)

---

### e2e/offline.spec.ts
- **Breaking changes**:
  1. Greeting text selector still works (`/good (morning|afternoon|evening),/i`).
  2. "Home" tab text still works.
  3. Minimal impact -- tests basic connectivity, not UI structure.
- **Selectors to update**:
  - No changes needed
- **New assertions needed**:
  - None
- **Wave**: N/A (no update needed)

---

### e2e/webhook-integration.spec.ts
- **Breaking changes**:
  1. Call detail section: status text matching `/missed|completed|voicemail/i` may break when badges become StatusDots.
  2. SummaryCards regression test: `getByText(/\d+ tasks/)` and `getByText(/\d+ meetings/)` -- context changes from separate cards to single StatLine.
  3. "Connected" / "Not Configured" pill badges become plain colored text in settings webhook section.
  4. "AI BRIEFING" label may change with hero card redesign.
- **Selectors to update**:
  - `getByText(/missed|completed|voicemail/i)` -> may need testID-based approach for call items
  - `getByText(/\d+ tasks/)` -> still matches StatLine text
  - `getByText(/\d+ meetings/)` -> still matches StatLine text
  - `getByText('AI BRIEFING')` -> verify new label
  - `getByText('Generate Briefing')` -> verify still exists
  - `getByText('Connected')` / `getByText('Not Configured')` -> still works as plain text
  - `getByText('Webhooks n8n')` -> still works
  - `getByText('Digest Schedule')` -> still works
  - `getByText('Sign Out')` -> still works
- **New assertions needed**:
  - Verify StatLine renders as single text element
  - Verify AI briefing hero card structure
- **Wave**: 2 (dashboard section), 3 (calls section), 4 (settings section) -- multi-wave

---

## MAESTRO FLOWS (24 flows + run-all.yaml)

---

### .maestro/home-screen.yaml
- **Breaking changes**:
  1. `assertVisible: "tasks"`, `assertVisible: "meetings"`, `assertVisible: "follow-ups"` -- these match partial text. With StatLine rendering "3 tasks . 2 meetings . 1 follow-up" as a single element, these partial matches should still work.
  2. `assertVisible: "Today's Schedule"` -- label may change with vertical timeline.
- **Selectors to update**:
  - `assertVisible: "Today's Schedule"` -> verify new label
  - Others should still work due to partial text matching
- **New assertions needed**:
  - Verify vertical timeline for calendar
  - Verify StatLine replaces SummaryCards
- **Wave**: 2

---

### .maestro/calls-screen.yaml
- **Breaking changes**:
  1. Filter chip text ("All", "Missed", "Voicemail") stays the same, so `tapOn` and `assertVisible` still work.
  2. Call items change from cards to FlatRows (visual only, no text change).
- **Selectors to update**:
  - None -- text selectors still match
- **New assertions needed**:
  - None critical (visual verification done manually)
- **Wave**: 3

---

### .maestro/team-screen.yaml
- **Breaking changes**:
  1. `assertVisible: "Task Board"` -- heading text may change.
  2. "To Do" and "In Progress" filter labels stay the same with UnderlineTabs.
  3. "Members" section header stays.
  4. "Priya" name stays.
- **Selectors to update**:
  - `assertVisible: "Task Board"` -> verify heading text in redesign
- **New assertions needed**:
  - None critical
- **Wave**: 3

---

### .maestro/command-screen.yaml
- **Breaking changes**:
  1. `tapOn: "Command"` -- tab label changes to "Versa" (BREAKS).
  2. `assertVisible: "Command"` -- heading changes to "Versa" (BREAKS).
  3. `assertVisible: "Ask me anything"` -- empty state text may change.
- **Selectors to update**:
  - `tapOn: "Command"` -> `tapOn: "Versa"`
  - `assertVisible: "Command"` -> `assertVisible: "Versa"`
  - `assertVisible: "Ask me anything"` -> verify new text
- **New assertions needed**:
  - Verify mic in input bar (not separate FAB)
- **Wave**: 4

---

### .maestro/settings-screen.yaml
- **Breaking changes**:
  1. "Satya Nadella", "satya@contoso.com", "Contoso Corp" -- all stay but context changes (inline header vs elevated card).
  2. "Preferences", "Integrations" section labels stay.
  3. "Sign Out" stays.
- **Selectors to update**:
  - None -- all text selectors still match
- **New assertions needed**:
  - None critical
- **Wave**: 4

---

### .maestro/voice-input-flow.yaml
- **Breaking changes**:
  1. `tapOn: "Command"` -> tab label changes to "Versa" (BREAKS).
  2. `assertVisible: "Command"` -> heading changes to "Versa" (BREAKS).
  3. `assertVisible: "Voice or text"` -> subtitle changes (BREAKS).
  4. `assertVisible: "Tap to speak"` -> voice merged into input bar, text changes (BREAKS).
  5. `assertVisible: "Ask me anything"` -> empty state text may change.
- **Selectors to update**:
  - `tapOn: "Command"` -> `tapOn: "Versa"`
  - `assertVisible: "Command"` -> `assertVisible: "Versa"`
  - `assertVisible: "Voice or text"` -> new subtitle text
  - `assertVisible: "Tap to speak"` -> removed or changed (mic in input bar)
  - `assertVisible: "Ask me anything"` -> verify new text
- **New assertions needed**:
  - Verify mic icon within input bar
  - Verify inline voice mode toggle
- **Wave**: 4

---

### .maestro/task-create-flow.yaml
- **Breaking changes**:
  1. `tapOn: "New Task"` -- quick action text changes to "+ Task" or similar (BREAKS).
  2. `assertVisible: "New Task"` -- modal heading may still be "New Task" (verify).
  3. Priority `tapOn: "High"` -- label text preserved with StatusDot, should still work.
  4. `tapOn: "Create Task"` -- submit button text stays.
  5. `tapOn: "What needs to be done?"` -- placeholder stays.
- **Selectors to update**:
  - `tapOn: "New Task"` (quick action on Home) -> `tapOn: "+ Task"` or use testID
  - `assertVisible: "New Task"` (modal heading) -> verify stays the same
- **New assertions needed**:
  - Verify StatusDot rendering for priority selection
- **Wave**: 5

---

### .maestro/delegate-flow.yaml
- **Breaking changes**:
  1. `assertVisible: "Manage your team and delegate tasks"` -- subtitle may change.
  2. Team screen FAB position may change (tap at "92%,7%").
  3. "Delegate Task", "Cancel", "Select Team Member" texts stay.
  4. `tapOn: "Priya"` stays.
  5. `tapOn: "What do you want to delegate?"` stays.
- **Selectors to update**:
  - `assertVisible: "Manage your team and delegate tasks"` -> verify new subtitle
  - FAB point tap `"92%,7%"` -> may need recalibration after layout changes
- **New assertions needed**:
  - None critical
- **Wave**: 5

---

### .maestro/calendar-flow.yaml
- **Breaking changes**:
  1. CalendarSnapshot becomes vertical timeline. `assertVisible: "Today's Schedule"` may change.
  2. WeekStreakRow simplified: 28px circles, no amber. `assertVisible: "MON"` still works.
  3. Week navigation chevron positions may shift. Point taps at "96%,18%" and "4%,18%" and "18%,18%" may break if layout padding changes (paddingTop 24 from 8-16).
- **Selectors to update**:
  - `assertVisible: "Today's Schedule"` -> verify new label
  - Point taps ("18%,18%", "96%,18%", "4%,18%") -> recalibrate after layout changes
- **New assertions needed**:
  - Verify vertical timeline rendering
  - Verify simplified week bar (28px circles, no amber)
- **Wave**: 2

---

### .maestro/notifications-flow.yaml
- **Breaking changes**:
  1. Bell icon position: tap at "90%,7%" may shift if header padding changes.
  2. Notification items change from cards to FlatRows.
  3. "Read all" text stays.
  4. Back button at "10%,7%" may shift.
- **Selectors to update**:
  - Point tap `"90%,7%"` -> recalibrate if header layout changes
  - Point tap `"10%,7%"` -> recalibrate for back navigation
- **New assertions needed**:
  - None critical
- **Wave**: 5

---

### .maestro/email-compose-flow.yaml
- **Breaking changes**:
  1. `assertVisible: "Email"` and `tapOn: "Email"` -- quick action text may change.
  2. "Compose Email", "To", "Subject", "Professional", "Friendly", "Urgent", "Generate & Send" all stay.
  3. `tapOn: "Cancel"` stays.
- **Selectors to update**:
  - `tapOn: "Email"` (quick action) -> verify text preserved
- **New assertions needed**:
  - None critical
- **Wave**: 5

---

### .maestro/reminder-create-flow.yaml
- **Breaking changes**:
  1. `tapOn: "Remind"` -- quick action text may change.
  2. "New Reminder", "Cancel", "Title", "Notes", "Date & Time", "Create Reminder" all stay.
  3. Placeholder taps stay.
- **Selectors to update**:
  - `tapOn: "Remind"` -> verify text preserved in redesigned quick actions
- **New assertions needed**:
  - None critical
- **Wave**: 5

---

### .maestro/call-log-create-flow.yaml
- **Breaking changes**:
  1. `tapOn: "Call"` -- quick action text preserved but component changes.
  2. "Log Call", "Cancel", "Caller Name", "Phone Number", "Direction", "Inbound", "Outbound" all stay.
  3. Placeholder taps stay.
- **Selectors to update**:
  - `tapOn: "Call"` -> verify text preserved
- **New assertions needed**:
  - None critical
- **Wave**: 5

---

### .maestro/all-tasks-flow.yaml
- **Breaking changes**:
  1. `tapOn: "See all"` -- link text stays if task section still has "See all".
  2. Filter tabs ("All", "To Do", "In Progress", "Done") become UnderlineTabs, text stays.
  3. "All Tasks", "Close" texts stay.
- **Selectors to update**:
  - `tapOn: "See all"` -> verify link still exists on dashboard task section
- **New assertions needed**:
  - Verify UnderlineTabs on all-tasks modal
- **Wave**: 5

---

### .maestro/call-detail-flow.yaml
- **Breaking changes**:
  1. Call items are now FlatRows. Wildcard tap `tapOn: { index: 0, text: ".*" }` should still work.
  2. "Call Details", "AI Summary", "Follow-ups", "Transcript" headings stay.
  3. Back button at "10%,7%" may shift.
- **Selectors to update**:
  - Point tap `"10%,7%"` -> recalibrate if layout shifts
- **New assertions needed**:
  - Verify expandable AI summary
- **Wave**: 3

---

### .maestro/morning-briefing-flow.yaml
- **Breaking changes**:
  1. `assertVisible: "tasks"`, `assertVisible: "meetings"`, `assertVisible: "follow-ups"` -- partial text match still works with StatLine.
  2. `assertVisible: "Today's Schedule"` -- label may change with vertical timeline.
- **Selectors to update**:
  - `assertVisible: "Today's Schedule"` -> verify new label
- **New assertions needed**:
  - Verify StatLine rendering
- **Wave**: 2

---

### .maestro/settings-integrations.yaml
- **Breaking changes**:
  1. All text selectors ("Calendar Sync", "Email Accounts", "Phone Configuration", "Voice Assistant", "Sign Out", "2.0.1") stay the same.
  2. Card wrappers removed but text content unchanged.
- **Selectors to update**:
  - None
- **New assertions needed**:
  - None critical
- **Wave**: 4

---

### .maestro/webhook-call-detail-flow.yaml
- **Breaking changes**:
  1. Call items now FlatRows. Wildcard tap `tapOn: { index: 0, text: ".*" }` still works.
  2. "Call Details", "Follow-ups", "Transcript", "Create Follow-up" texts stay.
  3. Back button at "10%,7%" may shift.
- **Selectors to update**:
  - Point tap `"10%,7%"` -> recalibrate if layout shifts
- **New assertions needed**:
  - None critical
- **Wave**: 3

---

### .maestro/settings-webhook-flow.yaml
- **Breaking changes**:
  1. All text selectors stay: "Settings", "Preferences", "Digest Schedule", "Integrations", "Webhooks n8n", "Calendar Sync", "Account", "Sign Out".
  2. Card wrappers removed but text content unchanged.
- **Selectors to update**:
  - None
- **New assertions needed**:
  - None critical
- **Wave**: 4

---

### .maestro/auth-signin.yaml
- **Breaking changes**: None. Auth screens are outside redesign scope.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: N/A

---

### .maestro/auth-signup.yaml
- **Breaking changes**: None. Auth screens are outside redesign scope.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: N/A

---

### .maestro/auth-signout.yaml
- **Breaking changes**: Settings tab text stays "Settings". "Sign Out" stays.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: N/A

---

### .maestro/auth-welcome.yaml
- **Breaking changes**: None. "Versa" text on welcome screen stays.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: N/A

---

### .maestro/auth-forgot-password.yaml
- **Breaking changes**: None. Auth screens are outside redesign scope.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: N/A

---

### .maestro/run-all.yaml
- **Breaking changes**: None directly. This is an orchestrator file. Passes/fails depend on individual flows.
- **Selectors to update**: None
- **New assertions needed**: None
- **Wave**: 6 (final full suite run)

---

## WAVE SUMMARY

### Wave 2 (Home Screen + Icons)
**Playwright**: `home.spec.ts`, `webhook-integration.spec.ts` (dashboard section)
**Maestro**: `home-screen.yaml`, `calendar-flow.yaml`, `morning-briefing-flow.yaml`

Key changes:
- SummaryCards -> StatLine text selectors
- QuickActions "New Task" -> "+ Task" text
- CalendarSnapshot -> vertical timeline labels
- AI Briefing hero card label
- WeekStreak layout recalibration

### Wave 3 (Calls + Team)
**Playwright**: `calls.spec.ts`, `call-detail.spec.ts`, `team.spec.ts`, `webhook-integration.spec.ts` (calls section)
**Maestro**: `calls-screen.yaml`, `team-screen.yaml`, `call-detail-flow.yaml`, `webhook-call-detail-flow.yaml`

Key changes:
- Filter pills -> UnderlineTabs (text preserved, component changes)
- Call items: card -> FlatRow selectors
- Status badge text -> StatusDot (testID-based selectors needed)
- Team search bar hidden by default
- Point tap recalibration for back buttons

### Wave 4 (Command + Settings + Tab Bar)
**Playwright**: `command.spec.ts`, `command-voice.spec.ts`, `settings.spec.ts`, `settings-integrations.spec.ts`, `webhook-integration.spec.ts` (settings section)
**Maestro**: `command-screen.yaml`, `voice-input-flow.yaml`, `settings-screen.yaml`, `settings-integrations.yaml`, `settings-webhook-flow.yaml`

Key changes:
- "Command" -> "Versa" (ALL selectors)
- Voice FAB -> mic in input bar
- "Tap to speak" removed
- Subtitle text changes
- Settings card wrappers removed (minimal text impact)
- Status pill badges -> plain colored text

### Wave 5 (Modals + Remaining)
**Playwright**: `task-create.spec.ts`, `task-detail.spec.ts`, `all-tasks.spec.ts`, `quick-actions.spec.ts`, `email-compose.spec.ts`, `reminder-create.spec.ts`, `call-log-create.spec.ts`, `notifications.spec.ts`
**Maestro**: `task-create-flow.yaml`, `delegate-flow.yaml`, `notifications-flow.yaml`, `email-compose-flow.yaml`, `reminder-create-flow.yaml`, `call-log-create-flow.yaml`, `all-tasks-flow.yaml`

Key changes:
- Priority chips -> StatusDot + text label (text preserved)
- Card wrappers removed from modal forms
- Cancel -> ghost text link (text preserved)
- Quick action text changes (New Task -> + Task)
- Direction chips -> radio-style (text preserved)
- Point tap recalibration for header buttons

### Wave 6 (Full Suite Run)
**Maestro**: `run-all.yaml`
All tests should pass after waves 2-5 updates.

### No Update Needed
**Playwright**: `auth.spec.ts`, `offline.spec.ts`
**Maestro**: `auth-signin.yaml`, `auth-signup.yaml`, `auth-signout.yaml`, `auth-welcome.yaml`, `auth-forgot-password.yaml`

---

## CRITICAL SELECTORS THAT DEFINITELY BREAK

These are the selectors that will 100% fail and must be updated:

| Selector | Files | New Value |
|----------|-------|-----------|
| `getByText('Command', { exact: true })` (tab nav) | `command.spec.ts`, `command-voice.spec.ts` | `getByText('Versa', { exact: true })` |
| `getByText('Command')` (heading) | `command.spec.ts`, `command-voice.spec.ts` | `getByText('Versa')` |
| `tapOn: "Command"` | `command-screen.yaml`, `voice-input-flow.yaml` | `tapOn: "Versa"` |
| `assertVisible: "Command"` | `command-screen.yaml`, `voice-input-flow.yaml` | `assertVisible: "Versa"` |
| `getByText('Tap to speak')` | `command-voice.spec.ts` | Remove or update (voice merged into input bar) |
| `assertVisible: "Tap to speak"` | `voice-input-flow.yaml` | Remove or update |
| `getByText('Voice or text...')` | `command.spec.ts`, `command-voice.spec.ts` | New subtitle text |
| `assertVisible: "Voice or text"` | `voice-input-flow.yaml` | New subtitle text |
| `getByText('New Task')` (quick action) | `quick-actions.spec.ts`, `home.spec.ts` | `getByText('+ Task')` or similar |
| `tapOn: "New Task"` (quick action) | `task-create-flow.yaml` | `tapOn: "+ Task"` or use testID |
| `getByPlaceholder('Search team or tasks...')` | `team.spec.ts` | Hidden by default; tap search icon first |

## testID REQUIREMENTS FOR NEW COMPONENTS

To make tests resilient, these new components need testID props:

| Component | testID Pattern | Used By |
|-----------|---------------|---------|
| StatusDot | `status-dot-{context}` | task-create, task-detail, all-tasks, calls |
| FlatRow | `flat-row-{context}` | home tasks, calls, team, settings, notifications |
| UnderlineTabs | `tab-{key}` | calls, team, all-tasks |
| StatLine | `stat-line` | home dashboard |
| InputBar mic icon | `input-bar-mic` | command screen |
