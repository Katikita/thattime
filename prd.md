PRD — “Thattime” Postcard Generator (Web)
1) Summary

Thattime lets users create a nostalgic postcard in 3 steps:

Upload a photo (auto-fit into a postcard/polaroid frame)

Write a message constrained inside the message area (keyboard up on mobile)

Generate a unique link to share (recipient opens and views with animation)

2) Goals

Deliver a high-vibe, tactile postcard experience (paper textures, envelope/polaroid feeling, micro-animations).

Make creation fast: user can finish within ~30–60 seconds.

Sharing is link-based (low friction, avoids email sending costs/complexity in MVP).

3) Non-goals (MVP)

Accounts / login

Payments

Multi-recipient campaigns

Editing after link is created (optional for v2)

Sending physical postcards

4) Target users

People who want to send a quick “thinking of you” note with an image.

Designers/creators who want a nice digital keepsake.

5) Core user flow (matches your screens)
Screen 0 — Landing (“Thattime”)

UI

Hero postcard collage / envelope background (as in your mock)

Headline: “Make postcard and send it to your loved one”

CTA: “Get started”

Animation

Subtle parallax / paper grain movement

CTA tap triggers transition to Step 1 (slide/zoom into work surface)

Acceptance

CTA navigates to /create?step=1 (or internal wizard state)

Screen 1 — Step 1: Upload photo

Primary action

“Tap here to upload photo” → opens file picker (camera roll)

Auto-fit behavior

After upload, photo is placed into the frame cover-fit (fill frame, crop overflow).

(Optional v1.5) User can drag to reposition + pinch/scroll to zoom.

UI

Clear Step label: “Step 1 Upload your photo”

Helper text: “Photo will adjust to fit automatically”

Button: Next

Edge cases

Very large photos: downscale client-side for performance

Unsupported format: show error + retry

No photo selected: Next disabled

Acceptance

A visible preview shows photo in frame.

Clicking Next moves to Step 2.

Screen 2 — Step 2: Write message (keyboard up + constrained frame)

Primary action

User taps message area → keyboard opens (mobile)

User writes text inside the message frame

Message frame constraint requirements

Text must not overflow outside the visible message frame.

If content exceeds visible height:

The message frame becomes internally scrollable, OR

Font auto-scales down (choose one for MVP; scroll is simplest).

Line wrapping happens at frame width.

“To …” line + message body + signature (like your mock)

Keyboard behavior (mobile web)

When keyboard opens:

Keep the message frame visible (use 100dvh layout + bottom-safe padding)

Avoid page jumping; the message area should remain focused

“Next” remains reachable (sticky button or top-right like your mock)

UI

Step label: “Step 2 Write messages”

Helper text can remain (though your mock repeats it—optional to change)

Next button

Acceptance

User can type naturally; text stays inside the frame.

Long message scrolls inside the message area (no layout break).

Next moves to Step 3.

Screen 3 — Step 3: Ready + Share link (recipient experience)

UI

Title: “Your postcard is ready”

Subtitle: “Share it to someone you love”

CTA: “Share” (copy link / system share)

Visual preview: postcard front/back composition as per your mock

Link generation

Creates a unique token and share URL: /p/{token}

MVP options:

Phase 1 (no backend): token maps to mock/local data (demo only)

Phase 2 (Supabase): store image + message, token resolves anywhere

Recipient experience

Opening /p/{token} shows an animated reveal:

postcard slide in / flip / paper movement

Display image and message (read-only)

Acceptance

User can copy/share link successfully.

Recipient link opens and displays the postcard.

6) Functional requirements
Must-have (MVP)

3-step create wizard

Photo upload + frame-fit

Message writing constrained to message frame

Share page /p/[token] renders postcard

Delightful transitions between steps

Nice-to-have (v2)

Drag/zoom crop controls

Templates (different stamps / paper types)

“Edit draft” before finalizing

Optional email send (via provider) after link generation

7) Content & styling requirements

Old-school postcard vibe:

Paper texture background

Polaroid/postcard border

Subtle grain, soft shadows

Typography:

Serif for headings, handwritten/mono feel for message (but keep readable)

Accessibility:

Sufficient contrast

Text size not too small

Motion respects reduced-motion setting (optional)

8) Data model (Phase 2 with Supabase)

postcards:

token (unique)

image_path (storage path)

message

to_name, from_name

created_at

9) Metrics (simple)

Create completion rate (Step 1→3)

Share click rate

Recipient open rate (Phase 2)

10) Risks / open questions

Do you want scroll-inside-frame OR auto font shrink? (I’d do scroll for MVP.)

Are postcards public via link, or require a simple “passcode”? (public link for MVP)

Do you need “delete postcard after X days” to control storage costs? (Phase 2)