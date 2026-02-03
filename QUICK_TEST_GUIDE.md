# Quick Manual Testing Guide

## ✅ Automated Tests: PASSED (30/30)

All code structure tests passed! Now let's test in the browser.

## 🚀 Start Testing

1. **Start dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open browser**: `http://localhost:3000`

---

## 📱 Test Flow (5 minutes)

### Step 1: Upload Photo
- Go to `/upload`
- Upload a test photo
- ✅ Check: Frame is 450px × 337.5px (desktop) or responsive (mobile)
- Click "Next"

### Step 2: Name Your Memory
- Go to `/photoname`
- Add a caption (e.g., "LOVE YOU 3000")
- ✅ Check: Frame size matches previous page
- ✅ Check: No horizontal scroll on mobile
- Click "Next"

### Step 3: Write Postcard
- Go to `/writepostcard`
- Fill in: To, Message, From
- ✅ Check: Frame size matches
- ✅ Check: Flip card - no double white layer
- Click "Next"

### Step 4: Preview & Share
- Go to `/preview`
- ✅ Check: Button shows "Preparing…" (disabled)
- Wait 2-3 seconds
- ✅ Check: Button changes to "SHARE" (enabled)
- Click "SHARE"
- ✅ Check: Toast shows "Copied ✅"
- ✅ Check: Link is in clipboard (paste somewhere to verify)
- ✅ Check: No native share sheet appears

### Step 5: Test Caching
- Refresh the page (F5)
- ✅ Check: Button immediately shows "SHARE" (no "Preparing…")
- ✅ Check: Clicking SHARE copies instantly (no re-upload)

### Step 6: Test Flip
- On `/preview` page
- Tap/swipe the postcard to flip
- ✅ Check: Only one white layer visible (no double background)
- ✅ Check: Front shows photo + caption
- ✅ Check: Back shows To/Message/From

---

## 🔍 Browser DevTools Checks

### Check Session Storage
1. Open DevTools (F12)
2. Go to **Application** tab → **Session Storage** → `http://localhost:3000`
3. ✅ Should see `share_url` key with a URL like `http://localhost:3000/p/[id]`

### Check Frame Sizing (Desktop)
1. Inspect `.polaroid-frame` element
2. ✅ Width should be exactly `450px`
3. ✅ Height should be `337.5px` (or auto with aspect-ratio)

### Check Frame Sizing (Mobile)
1. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
2. Select iPhone or mobile device
3. Inspect `.polaroid-frame` element
4. ✅ Width should be `min(95vw, 450px)` (responsive)
5. ✅ No horizontal scrollbar

---

## 🐛 Common Issues to Watch For

- ❌ **Double white layer**: Should be fixed (transparent background on outer container)
- ❌ **Horizontal scroll on iOS**: Should be fixed (responsive wrappers)
- ❌ **Duplicate DB entries**: Should be prevented (sessionStorage cache)
- ❌ **Native share sheet**: Should NOT appear (always copy to clipboard)
- ❌ **"Preparing…" on refresh**: Should NOT appear (uses cached URL)

---

## 📊 Test Results Template

```
Desktop Frame Size: [ ] Pass [ ] Fail
Mobile Frame Size: [ ] Pass [ ] Fail
Share Link Creation: [ ] Pass [ ] Fail
Share Button States: [ ] Pass [ ] Fail
Clipboard Copy: [ ] Pass [ ] Fail
Session Storage Cache: [ ] Pass [ ] Fail
Double Layer Fix: [ ] Pass [ ] Fail
No Horizontal Scroll: [ ] Pass [ ] Fail
```

---

## 🎯 Quick Commands

```bash
# Run automated tests
node test-polaroid-sharing.js

# Start dev server
npm run dev

# Check git status
git status
```

---

**Happy Testing! 🎉**
