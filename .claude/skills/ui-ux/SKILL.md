# UI/UX Pro Max — Taskora Design System Skill

## Description
Complete UI/UX design and implementation skill for the Taskora project. Covers modern design principles, responsive layouts, animations, accessibility, and component creation using the project's tech stack.

## When to use
Invoke this skill when the user asks to:
- Design, redesign, or improve any page or component
- Create new UI components (cards, modals, navbars, sidebars, forms, etc.)
- Fix layout, spacing, or visual issues
- Add animations or micro-interactions
- Improve accessibility (a11y)
- Make pages responsive
- Apply dark/light mode theming
- Improve UX flow or user interactions

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, RSC) |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (base-nova style) |
| Icons | lucide-react |
| Theming | next-themes (dark/light) |
| Animations | tw-animate-css + Tailwind transitions |
| Variants | class-variance-authority (CVA) |
| Utilities | clsx, tailwind-merge |
| i18n | next-intl (uz, ja locales) |
| Forms | react-hook-form + zod validation |

---

## Design Tokens (from globals.css)

### Colors
```
Primary:     #3b86ff (blue)
Background:  #ffffff (light) / #0a0a0a (dark)
Foreground:  #111111 (light) / #f5f5f5 (dark)
Secondary:   #f3f4f6 / #1f2937
Muted:       #f3f4f6 / #27272a
Accent:      #eff5ff / #1e3a5f
Destructive: #ef4444
Border:      #e8ecf0 / #27272a
```

### Radius
```
--radius: 1rem (base)
sm: 0.6x | md: 0.8x | lg: 1x | xl: 1.4x | 2xl: 1.8x
```

### Fonts
- Sans: Inter/system (--font-sans)
- Heading: same as sans (--font-heading)

---

## Design Principles

### 1. Visual Hierarchy
- Use font size + weight to establish hierarchy (not color alone)
- Page title: `text-2xl font-bold` or `text-3xl font-bold`
- Section title: `text-lg font-semibold` or `text-xl font-semibold`
- Body: `text-sm` or `text-base`
- Caption/meta: `text-xs text-muted-foreground`

### 2. Spacing System
- Use consistent Tailwind spacing: `gap-2`, `gap-4`, `gap-6`, `gap-8`
- Page padding: `p-4 md:p-6 lg:p-8`
- Card padding: `p-4` or `p-6`
- Between sections: `space-y-6` or `space-y-8`
- Between items: `space-y-2` or `gap-3`

### 3. Color Usage
- Primary actions: `bg-primary text-primary-foreground`
- Secondary actions: `bg-secondary text-secondary-foreground`
- Destructive: `bg-destructive text-white`
- Ghost/subtle: `hover:bg-accent`
- Text hierarchy: `text-foreground` > `text-muted-foreground` > `text-muted-foreground/60`

### 4. Responsive Breakpoints
```
sm:  640px   (mobile landscape)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (wide desktop)
2xl: 1536px  (ultra-wide)
```

### 5. Layout Patterns
- **App shell**: sidebar (collapsible) + header + main content
- **Dashboard**: CSS Grid with responsive columns `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Forms**: max-width container `max-w-md mx-auto` or `max-w-lg`
- **Lists**: vertical stack with dividers or cards
- **Detail pages**: two-column on desktop, stacked on mobile

---

## Component Patterns

### Button Variants (use shadcn Button)
```tsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon className="h-4 w-4" /></Button>
```

### Card Pattern
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
  <CardFooter>
    {/* actions */}
  </CardFooter>
</Card>
```

### Form Pattern
```tsx
<form>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Label</Label>
      <Input id="name" placeholder="Placeholder..." />
    </div>
    <Button type="submit" className="w-full">Submit</Button>
  </div>
</form>
```

### Stat Card Pattern
```tsx
<Card>
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Label</p>
        <p className="text-2xl font-bold">42</p>
      </div>
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Empty State Pattern
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <Icon className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold">No items yet</h3>
  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
    Description text here
  </p>
  <Button className="mt-4">
    <Plus className="h-4 w-4 mr-2" /> Add Item
  </Button>
</div>
```

### Loading Skeleton Pattern
```tsx
<div className="space-y-4">
  <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
  <div className="grid gap-4 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
</div>
```

---

## Animation Guidelines

### Transitions (prefer these for UI state changes)
```
transition-colors duration-200     — hover colors
transition-all duration-300        — size + color changes
transition-transform duration-200  — scale/move
```

### Entrance Animations (tw-animate-css)
```
animate-in fade-in             — fade in
animate-in slide-in-from-bottom-4  — slide up
animate-in slide-in-from-left-4    — slide from left
animate-in zoom-in-95          — subtle scale in
```

### Micro-interactions
- Buttons: `hover:scale-[1.02] active:scale-[0.98] transition-transform`
- Cards: `hover:shadow-md transition-shadow duration-200`
- Icons: `hover:text-primary transition-colors`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

---

## Accessibility Checklist

- All interactive elements must be keyboard navigable
- Use `aria-label` on icon-only buttons
- Color contrast ratio >= 4.5:1 for text
- Focus states visible with `focus-visible:` utilities
- Form inputs linked to labels via `htmlFor`/`id`
- Error messages use `aria-describedby`
- Loading states use `aria-busy="true"`
- Modals trap focus and have `aria-modal="true"`

---

## Dark Mode Rules

- Always use semantic color tokens (`bg-background`, `text-foreground`, etc.)
- Never hardcode colors like `bg-white` or `text-black`
- Use `bg-card` for elevated surfaces
- Use `bg-muted` for subtle backgrounds
- Borders: `border-border`
- Test both themes when making changes

---

## Responsive Design Rules

- Mobile-first: write base styles for mobile, add `md:` and `lg:` for larger
- Navigation: collapsible sidebar on mobile, expanded on desktop
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Typography scales: `text-lg md:text-xl lg:text-2xl`
- Hide non-essential elements on mobile: `hidden md:block`
- Touch targets: minimum `h-10 w-10` (40px) on mobile
- Padding: `px-4 md:px-6 lg:px-8`

---

## File Organization

```
src/components/
  ui/          — shadcn base components (button, input, card, etc.)
  auth/        — authentication components
  calendar/    — calendar-related components
  dashboard/   — dashboard widgets
  layout/      — app shell, sidebar, header
  tasks/       — task-related components
  projects/    — project-related components
```

### Adding New shadcn Components
```bash
npx shadcn@latest add [component-name]
```

---

## Implementation Workflow

1. **Understand** — Read existing component/page code first
2. **Design** — Plan layout with semantic tokens and responsive breakpoints
3. **Build** — Use shadcn components, Tailwind utilities, lucide icons
4. **Animate** — Add subtle transitions and entrance animations
5. **Responsive** — Test at mobile (375px), tablet (768px), desktop (1280px)
6. **Dark mode** — Verify both themes look correct
7. **A11y** — Check keyboard navigation and screen reader compat
8. **i18n** — Use translation keys from `messages/` directory, not hardcoded text
