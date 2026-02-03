# Testing Checklist

## 1. Polaroid Frame Sizing (Desktop & Mobile)

### Desktop Testing (≥ 768px width)
- [ ] **/upload page**: Frame is exactly 450px × 337.5px
- [ ] **/photoname page**: Frame is exactly 450px × 337.5px
- [ ] **/writepostcard page**: Frame is exactly 450px × 337.5px
- [ ] **/preview page**: Frame is exactly 450px × 337.5px
- [ ] All pages have consistent padding (15px, padding-bottom: 30.6px)
- [ ] No visual differences between pages on desktop

### Mobile Testing (< 768px width)
- [ ] **/upload page**: Frame uses `min(95vw, 450px)` - responsive sizing
- [ ] **/photoname page**: Frame uses `min(95vw, 450px)` - responsive sizing
- [ ] **/writepostcard page**: Frame uses `min(95vw, 450px)` - responsive sizing
- [ ] **/preview page**: Frame uses `min(95vw, 450px)` - responsive sizing
- [ ] All pages have the same frame size on mobile
- [ ] No horizontal scrolling/panning on iOS Safari
- [ ] Frame scales properly on different mobile screen sizes

### Visual Checks
- [ ] No double white layers on any page
- [ ] Tape decoration positions correctly (percentage-based)
- [ ] Marker graphic scales properly on mobile (percentage-based)

---

## 2. Preview Page Sharing UX

### Share Link Creation
- [ ] On page load, SHARE button shows "Preparing…" (disabled state)
- [ ] After link is created, SHARE button shows "SHARE" (enabled)
- [ ] Link is created automatically on mount (no user action needed)
- [ ] Link is cached in sessionStorage (check DevTools → Application → Session Storage → `share_url`)

### Share Button Behavior
- [ ] Clicking SHARE when ready copies link to clipboard instantly
- [ ] Toast notification shows "Copied ✅" after copy
- [ ] Toast auto-dismisses after 2 seconds
- [ ] No native share sheet appears
- [ ] Double-clicking SHARE doesn't create duplicate uploads/DB rows

### Error Handling
- [ ] If link creation fails, button shows "Retry" (red background)
- [ ] Clicking "Retry" attempts to create link again
- [ ] Error state is displayed properly

### Session Storage Cache
- [ ] Refresh page → link is reused from cache (no re-upload)
- [ ] Clear sessionStorage → new link is created on next load
- [ ] Link persists across navigation within same session

### Fallback Modal (if clipboard fails)
- [ ] Modal appears with share URL displayed
- [ ] "Copy Link" button works
- [ ] "Open Link" button opens URL in new tab
- [ ] Clicking backdrop closes modal

---

## 3. Postcard Flip Functionality

### Preview Page
- [ ] Flipping postcard shows only one layer (no double white background)
- [ ] Front side shows photo + caption correctly
- [ ] Back side shows To/Message/From correctly
- [ ] Flip animation is smooth
- [ ] Tap/swipe detection works on mobile

### Write Postcard Page
- [ ] Flip card shows only one layer (no double white background)
- [ ] Front side is empty/placeholder
- [ ] Back side shows form correctly
- [ ] Flip animation works smoothly

---

## 4. Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Safari (macOS)
- [ ] Firefox

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome iOS
- [ ] Chrome Android

---

## 5. Edge Cases

- [ ] Empty form fields → SHARE still works
- [ ] Very long captions → display correctly
- [ ] Very long messages → display correctly
- [ ] Network offline → error handling works
- [ ] Rapid navigation → no duplicate requests
- [ ] Browser back/forward → state preserved correctly

---

## Quick Test Script

1. **Start dev server**: `npm run dev`
2. **Test flow**:
   - Go to `/upload` → upload photo → Next
   - Go to `/photoname` → add caption → Next
   - Go to `/writepostcard` → fill form → Next
   - Go to `/preview` → verify "Preparing…" → wait → verify "SHARE"
   - Click SHARE → verify clipboard copy + toast
   - Refresh page → verify instant "SHARE" (cached)
   - Flip postcard → verify no double layer
3. **Mobile testing**: Use browser DevTools device emulation or test on real device

---

## Known Issues to Watch For

- [ ] iOS Safari horizontal scroll (should be fixed)
- [ ] Double white layers (should be fixed)
- [ ] Duplicate DB entries (should be prevented by cache)
- [ ] Toast notification positioning
- [ ] Modal backdrop click behavior
