# `crxlauncher` hydration warning

If the Next.js overlay shows a diff like this:

```text
- crxlauncher-bridged=""
- crxlauncher=""
```

the attributes were injected by a browser extension before React hydrated the page. They are not rendered by OurStory MM and are not part of the server response.

Version 1.10.3 adds `suppressHydrationWarning` to the root `<html>` element. This is intentionally limited to the element that external extensions mutate; it does not suppress mismatches in the body, pages, forms, or 3D components.

For local confirmation:

1. Stop `npm run dev` with Ctrl+C.
2. Restart it with `npm run dev` and reload the page.
3. If the overlay remains, open the same URL in a private window or disable the extension that adds `crxlauncher`/launcher attributes.
4. Clear the dev overlay with a hard reload: `Cmd+Shift+R` on Mac.

The warning is normally harmless, but the extension should be disabled for browser QA because extensions can change page markup or behavior. Do not add `crxlauncher` attributes to the application yourself.
