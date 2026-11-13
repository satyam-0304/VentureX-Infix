---
name: Luminous Focus
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777c'
  outline-variant: '#c6c6cb'
  surface-tint: '#5a5e68'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#171c24'
  on-primary-container: '#7f848e'
  inverse-primary: '#c2c6d2'
  secondary: '#5746cb'
  on-secondary: '#ffffff'
  secondary-container: '#7061e5'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d0026'
  on-tertiary-container: '#d3579a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee2ee'
  primary-fixed-dim: '#c2c6d2'
  on-primary-fixed: '#171c24'
  on-primary-fixed-variant: '#424750'
  secondary-fixed: '#e4dfff'
  secondary-fixed-dim: '#c7bfff'
  on-secondary-fixed: '#170065'
  on-secondary-fixed-variant: '#412cb4'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets learners who desire an uncluttered, premium, and calming educational environment. The brand personality balances quiet academic rigor with approachable delight: focused, intelligent, gentle, and modern. 

The aesthetic is anchored in **Soft Luminescent Minimalism** with tactile, modern glass touches. The interface uses generous white surface canvases resting upon an ethereal ambient lavender-to-blush gradient backdrop. High-contrast anchors—such as an ultra-deep slate navigation bar and obsidian active state pills—provide clear visual grounding. Subtle pastels (delicate lilac, soft strawberry pink, and crisp mint) are deployed functionally to categorize curriculum modules, indicate interactive word targets, and surface active lesson states without cognitive fatigue.

## Colors

The palette revolves around deep, confident accents set against luminous pastel atmospheres.

- **Primary (`#0F141C`)**: An obsidian slate used for focused states, top navigation active indicators, primary icon containers, and high-emphasis typography.
- **Secondary (`#7C6DF2`)**: A saturated lavender used for progress tracking, completed check markers, active exercise cues, and interactive highlights.
- **Tertiary (`#F472B6`)**: A soft strawberry pink used for fill-in-the-gap drop targets, milestone indicators, interactive token drops, and playful micro-states.
- **Neutral (`#64748B`)**: Balanced slate gray for secondary labels, timestamps, disabled indicators, and structural outline strokes.

### Functional Tint Surfaces
- **Canvas Ambient**: Soft dynamic radial gradient between `#EDE9FE` (50%), `#FCE7F3` (30%), and `#F8FAFC` (20%).
- **Card Surface**: `#FFFFFF` with 94%–98% opacity for crisp separation from ambient glows.
- **Interactive Exercise Wells**: `#FDF2F8` (pink tint target) and `#EEF2FF` (lavender tint target) with 50% opacity.
- **Success & Alert**: Mint Green (`#10B981`) for correct answers and validated steps; Coral Rose (`#F43F5E`) for error feedback.

## Typography

The typography leverages Inter exclusively across all scales to maintain geometric clarity, high legibility during intensive study, and modern neutral elegance.

- Headings rely on semi-bold (`600`) weights with tight negative tracking (`-0.01em` to `-0.02em`) to ensure titles and lesson questions feel compact and authoritative.
- Body copy adheres to normal weight (`400`) with generous line-heights for optimal legibility during sustained reading periods.
- Interactive controls, pills, interactive tags, and task timestamps use medium (`500`) and semi-bold (`600`) weights with slight positive letter spacing at micro scales (`11px`–`12px`) for instant scanning.

## Layout & Spacing

The layout uses a responsive fluid grid system designed around focused learning panels and interactive sideboards:
- **Desktop (1024px+)**: A 12-column layout split between a floating slim tool rail (72px fixed), a dominant media/interaction workspace (8 columns), and an expandable task syllabus panel (4 columns). Standard margin is `2rem` with a `1.5rem` gutter.
- **Tablet (768px–1023px)**: Reflows to a stacked 8-column layout with the task drawer collapsing into an anchored bottom sheet or a tabbed view beneath the active video lesson. Margin is `1.5rem`, gutter is `1rem`.
- **Mobile (<768px)**: A unified 4-column layout where video player, interactive question sets, and syllabus cards stack vertically with `1rem` margins and `0.75rem` gutters.

Internal component rhythm follows a consistent 4px/8px modular base scale (`space-xs` through `space-xl`).

## Elevation & Depth

Visual depth is achieved through layered tonal opacity and soft diffused multi-stop shadows rather than hard planar borders.

- **Level 0 (Base Canvas)**: Soft ambient gradient blend (`#EDE9FE` to `#FCE7F3`) creating an immersive, relaxing halo around the viewport.
- **Level 1 (Main Content Card)**: Pure white `#FFFFFF` shell with `0 24px 64px -12px rgba(15, 23, 42, 0.08)` and a delicate 1px boundary stroke (`rgba(255, 255, 255, 0.8)`).
- **Level 2 (Panels & Video Container)**: Embedded containers inside the main card using flat fills or subtle nested recesses with inset shadows `inset 0 1px 2px rgba(0, 0, 0, 0.04)`.
- **Level 3 (Draggable Tokens & Popover Controls)**: Interactive items (e.g., draggable word pills or quiz validation tooltips) float with `0 12px 28px -6px rgba(15, 20, 28, 0.16)` and an active lift transform (`translateY(-2px)`).
- **Glassmorphic Overlays**: Floating video controls, timestamp badges, and lesson navigation use backdrop filter `blur(16px)` with `background: rgba(15, 20, 28, 0.65)` for dark items or `rgba(255, 255, 255, 0.75)` for light contextual menus.

## Shapes

The design system embraces a generous, organic rounded aesthetic (`roundedness: 2`) that conveys warmth, safety, and modern approachability.

- **Primary Cards & Outer Frame**: Styled with `rounded-xl` (1.5rem to 2rem) corner radii, giving the entire viewport an ultra-smooth floating tablet appearance.
- **Inner Modules & Lesson Cells**: Utilize `rounded-lg` (1rem) for syllabus lists, video viewports, and exercise containers.
- **Buttons, Word Tokens, and Badges**: Leverage full pill radii (`9999px`) for interactive items like draggable sentence chips, module filters, and icon toggle switches.

## Components

### Buttons & Interactive Pills
- **Primary Action**: Deep obsidian slate (`#0F141C`) fill with white text, pill radius, `padding: 0.75rem 1.5rem`, accompanied by a smooth hover transition to `#1E293B`.
- **Secondary / Filter Pill**: White background with a faint border (`#E2E8F0`), slate text, transitioning to `#0F141C` background and white text when selected.
- **Icon Button**: Circular or squircle (`rounded-lg`) containers with light neutral fill (`#F1F5F9`) or translucent white/dark glass depending on context.

### Interactive Drag-and-Drop Chips
- **Resting Tokens**: Pristine white pill, subtle hairline border (`#E2E8F0`), dark slate typography, slight shadow.
- **Dragging / Selected**: Deep slate fill (`#0F141C`), inverted crisp white text, elevated drop shadow, and small pastel avatar tags indicating active collaborator/learner.
- **Target Slots**: Rounded rectangles with soft pink (`#FCE7F3`) or lavender (`#EDE9FE`) tinted fills, dashed border on focus, with smooth snapping animations.

### Syllabus & Module Accordion
- **Parent Unit**: White container with `rounded-lg`, containing module title, time duration, expand chevron, and a circular progress ring or completed check badge (`#7C6DF2`).
- **Child Task Row**: Indented row with micro-icon representing task type (e.g., pen for writing, mic for speaking, video for lecture). Active row is highlighted with a solid dark slate fill (`#0F141C`) and white text. Locked rows show a muted padlock icon with 50% opacity text.

### Video Player Chrome
- Clean, uncluttered media display with 1rem rounded viewport.
- Floating translucent bottom bar (`rgba(15, 20, 28, 0.75)` backdrop blur) hosting elapsed time, play/pause controls, dynamic scrubber with lavender progress fill, and volume/fullscreen icons.

### Multiple Choice & Quiz Modules
- Stacked choice cards with `0.75rem` rounded corners and light borders.
- **Correct State**: Border and soft background tint in mint green (`#ECFDF5`), paired with a green checkmark circle.
- **Incorrect State**: Border and soft background tint in light coral (`#FFF1F2`), displaying a red cross icon.
- **Explanation Box**: Integrated collapsible footer drawer offering immediate pedagogical reinforcement with yellow or lavender ambient light.