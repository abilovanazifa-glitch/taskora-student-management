# Taskora Design System (MASTER)

Brand: **#3B86FF** · Font: **Inter** · Style: **Clean bento SaaS**

## Colors

| Token | Light | Usage |
| ----- | ----- | ----- |
| `--brand` / `--primary` | `#3B86FF` | CTAs, active nav, links |
| `--canvas` | `#F8F9FA` | App background |
| `--background` | `#FFFFFF` | Cards, header |
| `--foreground` | `#111111` | Headings, primary text |
| `--muted-foreground` | `#52525B` | Secondary text (readable contrast) |
| `--border` | `#E8ECF0` | Card & input borders |
| `--accent` | `#EFF5FF` | Icon wells, highlights |

## Typography (Inter)

Minimum readable sizes — mobile body is always **16px**.

| Class | Size | Use |
| ----- | ---- | --- |
| `.text-display` | 32–40px | Page title (h1) |
| `.text-title-lg` | 20–24px | Section title (h2) |
| `.text-title` | 18px | Card / panel title (h3) |
| `.text-body` | 16px / leading-7 | Default body |
| `.text-body-sm` | 15px | Secondary UI text |
| `.text-caption` | 15px muted | Hints, metadata |
| `.text-label` | 16px medium | Form labels |

Rules:
- Never use `text-xs` for body copy or metadata
- Never shrink inputs below 16px on any breakpoint
- Headings: `font-semibold`, `tracking-tight`, `text-balance`
- Body: `leading-7`, `text-pretty`
- Muted text uses `#52525B` minimum for contrast

## Touch & Form Controls

| Control | Height | Font |
| ------- | ------ | ---- |
| Input / Select | 44px (`h-11`) | 16px |
| Textarea | min 112px | 16px |
| Default button | 40px (`h-10`) | 16px |
| Large button | 44px (`h-11`) | 16px |

## Spacing

| Token | Value | Use |
| ----- | ----- | --- |
| Page stack gap | `gap-8` | Between major blocks |
| Section gap | `gap-4` | Inside sections |
| Card padding | `p-5` / `p-6` | Bento cards |
| Table cell | `py-4` | Comfortable row height |

## Radius

| Element | Class |
| ------- | ----- |
| Bento cards | `rounded-3xl` |
| Inner wells | `rounded-2xl` |
| Buttons / inputs | `rounded-xl` |
| Pills / badges | `rounded-full` |

## Layout

- Use `PageStack` — do not duplicate `max-w-*` per page
- Wide: `max-w-7xl`, Medium: `max-w-6xl`, Narrow: `max-w-4xl`
