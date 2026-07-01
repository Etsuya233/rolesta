# Rolesta Frontend Design Rules

Date: 2026-07-01

## Purpose

This spec defines Rolesta's frontend UI and styling rules before product feature work expands. It covers visual direction, design tokens, theming boundaries, stable CSS hooks, responsive behavior, interaction states, accessibility, and component layering.

Rolesta should feel like a roleplay chat workbench. The default interface prioritizes chat, asset organization, preset configuration, and context debugging. Character-focused surfaces may use stronger visual expression, but system surfaces should remain calm, readable, and durable.

## Chosen Approach

Rolesta will use a token-driven design system with stable component slots.

Default visual decisions should be expressed through `--rl-*` CSS variables. Components should expose stable `rl-*` BEM classes on their root nodes and important parts. This gives the initial product a consistent light and dark theme, while leaving room for future custom CSS and theme packages.

The project will not define a full theme marketplace, theme manifest format, CSS sandbox, or theme package lifecycle in this phase. Those can be added later on top of the token and class contract.

## Visual Principles

Rolesta's base UI is a workbench, not a marketing page. It should be quiet, scannable, and efficient for repeated use.

The visual system has two color layers:

- System semantic colors for backgrounds, text, borders, primary actions, warnings, errors, success states, focus states, and disabled states.
- Content accent colors for business objects such as characters, chats, worldbooks, presets, model profiles, tags, and debug records.

Character and content accents may appear in chat messages, character cards, character detail headers, and related asset surfaces. They must not replace system semantic colors in settings, login, generic forms, navigation, or debugging panels.

## Design Tokens

All reusable visual values should use CSS variables with the `--rl-*` prefix. The first token set should cover:

- Colors.
- Spacing.
- Radius.
- Shadow.
- Font sizes and line heights.
- Z-index layers.
- Motion durations and easing.

Components should consume tokens instead of hard-coding visual values. Direct literal colors in components should be reserved for external brand assets or non-themeable imported media.

Recommended base color token shape:

```css
:root {
  --rl-color-bg: #f7f5f2;
  --rl-color-surface: #ffffff;
  --rl-color-surface-raised: #fbfaf8;
  --rl-color-surface-muted: #efebe5;

  --rl-color-text: #211f1c;
  --rl-color-text-muted: #746f67;
  --rl-color-text-subtle: #9a9288;
  --rl-color-border: #ded8cf;
  --rl-color-border-strong: #bdb4a8;

  --rl-color-primary: #6f4bd8;
  --rl-color-success: #2f855a;
  --rl-color-warning: #b7791f;
  --rl-color-danger: #c53030;
  --rl-color-info: #2b6cb0;
  --rl-color-focus: #7c5cff;

  --rl-color-character: #9b5de5;
  --rl-color-worldbook: #008f7a;
  --rl-color-preset: #d97706;
  --rl-color-debug: #4a5568;
}
```

Dark theme should override the same token names under `[data-theme="dark"]`. Component selectors should not need a separate dark-theme implementation when token overrides are enough.

## Color Rules

Each page should keep accent color usage limited. A normal workflow page should have one dominant accent. Business object lists may show multiple object colors, but those colors should use limited area or lower saturation.

Semantic colors are reserved for meaning:

- `danger` means destructive action or error.
- `warning` means risk, conflict, or attention.
- `success` means completion or healthy state.
- `info` means neutral system information.
- `focus` means active keyboard or input focus.

Text, borders, focus states, disabled states, selected states, and error states must remain readable in light and dark themes. Background layering should generally stay within four levels: page background, normal surface, raised surface, and selected or hover surface.

## Stable Classes And Slots

Components use stable BEM classes with the `rl-` prefix:

```text
rl-block
rl-block__element
rl-block--modifier
rl-block__element--modifier
```

Every reusable component root should expose a stable class. Important parts that theme authors, page styles, or tests need to target should expose stable element classes. Temporary wrapper nodes and implementation-only DOM nodes do not need public classes.

Example:

```tsx
<article className="rl-chat-message rl-chat-message--assistant">
  <img className="rl-chat-message__avatar" />
  <div className="rl-chat-message__body">
    <header className="rl-chat-message__meta">
      <span className="rl-chat-message__name">Alice</span>
      <time className="rl-chat-message__time">12:30</time>
    </header>
    <div className="rl-chat-message__content">...</div>
    <footer className="rl-chat-message__actions">...</footer>
  </div>
</article>
```

Public classes fall into three groups:

- Component classes, such as `rl-button`, `rl-chat-message`, and `rl-character-card`.
- Slot classes, such as `rl-chat-message__avatar` and `rl-chat-message__content`.
- State classes, such as `rl-chat-message--user`, `rl-button--danger`, and `rl-panel--collapsed`.

State may also use semantic `data-*` attributes when the value is dynamic or shared across variants:

```tsx
<button
  className="rl-button rl-button--primary"
  data-size="sm"
  data-loading={isLoading ? "true" : undefined}
>
  Save
</button>
```

Avoid adding classes to every DOM node for future possibilities. Stable classes are part of the theming contract, so they should describe parts that are meaningful to style, override, inspect, or test.

## Custom CSS Boundaries

The intended CSS order is:

1. Base tokens and reset.
2. Base component styles.
3. Feature and page styles.
4. User custom CSS.

User custom CSS may rely on documented `--rl-*` tokens and stable `rl-*` classes. It should not rely on undocumented DOM nesting, third-party library internals, generated class names, or temporary wrappers.

Component-level variables are allowed when a component needs a focused extension point:

```css
.rl-chat-message {
  --rl-chat-message-accent: var(--rl-color-character);
}

.rl-chat-message__body {
  border-inline-start: 3px solid var(--rl-chat-message-accent);
}
```

## Responsive Rules

Responsive behavior should use capability-oriented breakpoint names in design discussions:

```text
narrow: small phones, single column first
compact: large phones and small tablets, single column with drawers
medium: tablets and small desktops, two columns possible
wide: desktops, workbench layouts possible
```

These names may map to Tailwind breakpoints in code. Product and design rules should use the semantic names so that exact pixel values can change later.

Core flows must work on phone, tablet, and desktop widths:

- Log in.
- Select or open a character.
- Start or continue a chat.
- Send a message.
- Stop generation.
- Regenerate or edit a message.
- Switch preset.
- View a generation debug summary.
- Save characters, worldbooks, presets, and model profiles.

Narrow screens may reduce simultaneous information, but they must keep core actions reachable.

## Page Layout Rules

Chat workbench:

- Narrow screens show the message list and composer first. Character details, presets, runtime information, and debug details move into drawers, menus, or segmented secondary views.
- Medium screens may show the message list plus one side panel.
- Wide screens may show session or asset navigation, message flow, and context or debug panels together.

Asset management:

- Narrow screens use a list or single-column cards.
- Medium screens may use two columns.
- Wide screens may use tables, filters, and detail panes.

Editing forms:

- Narrow screens use one-column fields.
- Wide screens may add a side preview, help panel, or related object panel.
- Submit, cancel, and save-draft actions must stay predictable across widths.

Debug surfaces:

- Narrow screens show summary and failure reason first.
- Detailed request fragments, variable replacements, matched worldbook entries, and truncation details may be grouped behind collapsible sections.
- Wide screens may show summary and raw details side by side.

## Layout Stability

Fixed-format UI should have stable dimensions or ratios: avatars, icon buttons, toolbar controls, list rows, card covers, counters, and small status chips.

Text should not scale with viewport width. Long character names, preset names, tags, and debug labels must wrap, truncate, or move into detail views. Menus, drawers, popovers, and dialogs must fit inside narrow viewports. The mobile composer should keep its send action available when the software keyboard is open.

Wide multi-column layouts need minimum widths and collapse rules. If a viewport cannot support the intended columns, the layout should collapse before content overlaps or becomes unreadable.

## Interaction States

Interactive components must define these relevant states:

- Default.
- Hover.
- Pressed.
- Focus.
- Disabled.
- Loading.
- Selected.
- Error.

Touch devices do not have reliable hover. Important information and required actions must not exist only in hover states. Desktop hover may reveal low-frequency message actions, but narrow screens need a visible menu, long-press action, or fixed control.

Generation status needs clear states:

- Requesting.
- Streaming.
- Stopped.
- Failed.
- Complete.

Message actions should not cover message content. Destructive actions such as deleting a character, deleting a worldbook, or clearing a chat require explicit wording and confirmation.

## Accessibility Rules

Keyboard users must be able to complete the core flows. Focus states should use `--rl-color-focus` or a derived focus token. Do not remove focus outlines unless an equally visible replacement is present.

Buttons, inputs, selects, menus, dialogs, drawers, and toast notifications should use semantic HTML or proven accessible primitives. Icon-only buttons need readable labels. Errors should appear near the related field or region and should not rely on color alone.

Long scrollable areas need clear boundaries, especially message flows, worldbook entries, and debug details. Theme switching must preserve readable text, visible focus, selected state, disabled state, and error state.

## Component Layers

The frontend should keep these layers clear:

- App shell: routing container, navigation, theme container, global layout, and global overlays.
- Feature areas: chat workbench, asset management, character editing, worldbook editing, preset configuration, and debug panels.
- Business components: character cards, chat messages, worldbook entries, preset summaries, model profile summaries, and debug records.
- Base UI components: buttons, inputs, labels, menus, dialogs, drawers, separators, fields, and cards.

Recommended structure:

```text
src/
  styles/
    globals.css
  components/
    ui/
  features/
    chats/
      components/
      routes/
    characters/
      components/
      routes/
```

Global reset, base tokens, and light or dark theme definitions belong in global styles. Component styles should stay near the component when practical. Route files should compose layout and data flow, not own reusable component internals.

## Prohibited Patterns

- Scattered hard-coded component colors.
- Semantic status colors used as decoration.
- Required actions available only through hover.
- Desktop-only completion of core flows.
- Public classes on every DOM node without a theming, testing, or styling reason.
- Excessive cards, borders, shadows, and accent colors on one page.
- Marketing-style hero treatment for the workbench.
- Character theme colors spreading into generic settings, login, and debug surfaces.
- Critical information shown only in tiny or low-contrast text.
- Components that implement only the default state while omitting loading, error, disabled, and focus states.

## Acceptance Criteria

New frontend work should be reviewable against these questions:

- Which tokens does it use?
- Which stable classes or slots does it expose?
- Which interaction states are implemented?
- How does the layout change across narrow, compact, medium, and wide widths?
- Can the page's core flow be completed on a phone-sized viewport?
- Do light and dark themes keep text, borders, focus, errors, disabled controls, and selected states readable?
- Do business accent colors stay within their intended surfaces?

## Decisions

- Use `--rl-*` CSS variables for design tokens.
- Support light and dark themes first.
- Reserve custom CSS support through documented tokens and stable `rl-*` classes.
- Use BEM class naming for stable component and slot selectors.
- Keep implementation-only DOM nodes outside the public styling contract.
- Treat responsive support as a core requirement for every page.
- Keep Rolesta's base UI workbench-oriented, with stronger visual expression only in character-related contexts.
- Use semantic breakpoint names in design specs and map them to concrete CSS or Tailwind breakpoints in implementation.
