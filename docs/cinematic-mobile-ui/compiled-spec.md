# Mobile Cinematic Refresh Compiled Spec

## External Library Decision

### Q1: What is the core motion experience of this page?

- Warm surface depth, subtle lift, and modal-sheet transitions

### Q2: Can the native library entries do it?

- Yes, no external library

### Q3: If an external library is used, why this one and how will it be re-directed through the chosen film language?

- No external library needed

### Decision

- External libraries: none

## Shared Token Moves

- Keep existing primary orange palette
- Add supporting surface, shadow, and text tokens for depth
- Introduce one editorial serif heading family fallback without making body copy harder to read
- Use layered background gradients instead of a flat gray page
- Add scene labels, archive labels, and marquee-like banner blocks that point clearly to `Chungking Express`

## Shared Surface Rules

- Main mobile surfaces: 22-32px radius with stronger shadow and inner stroke
- Inputs and chips: softer background fill, clearer focus ring, more vertical breathing room
- Top bars: sticky, semi-translucent, with blur and a darker warm gradient
- Modals: bottom-sheet feeling on mobile, soft border, warm shadow, clear footer actions

## Shared Page Rules

- Register: single luminous card, framed notice blocks, stronger field labels and primary CTA
- OrderFood: taller image zone, richer card footer, calmer chips, better search / tabs hierarchy
- MyOrders: archive-like cards, inset item blocks, more deliberate status badges, stronger action grouping

## Reduced Motion

- Keep transitions short and simple
- Remove large transforms for users who prefer reduced motion
