# 10 second trailer (MiniMax / Hailuo image-to-video)

Three shots of about 3.5 seconds each, cut hard to the on-camera walkthrough. Use the reference frames in the film pack (`concept-references/`) as the first frame of each shot and `brand/scout-transition.webp` for the mascot. Generate 6s clips and trim them. Add text and music in the edit, not in the generation (models garble text). Use only licensed or royalty-free audio.

| # | First frame | Prompt | On-screen text (edit) |
|---|---|---|---|
| 1 | `01-court-question.png` | Slow push-in on an outdoor city basketball court at golden hour, a phone in the foreground showing a question bubble, soft bokeh, gentle handheld motion, warm cinematic light, no text | "Is a hoop free right now?" |
| 2 | `02-court-liftoff.png` | The glossy yellow star-shaped mascot with two dark oval eyes lifts off the phone screen and flies across the city skyline toward the court, playful arc, smooth camera follow, soft 3D toy render, no text | (none) |
| 3 | `08-park-brand-ending.png` | The yellow mascot lands in front of the camera, faces forward and blinks once, background softly blurs to cream, clean studio lighting, subtle bounce, no text | **yonder.** · Ask someone already there. |

Tips:

- **Keep the mascot consistent.** Pass the same mascot image as a subject reference in every shot. Negative prompt: "extra limbs, mouth, text, watermark, distorted eyes".
- **Film pace.** Shots 1 and 3 read best at 24fps with 0.9x speed. Shot 2 can run at full speed.
- **Hand-off.** End on the cream background so the cut to the seated split screen feels intentional.
