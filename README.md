# Climate Campaign Creator

Build a polished React + TypeScript web app called “ClimateAction Local” that generates

localized climate campaigns through an n8n webhook and renders the returned audio and

image cleanly in the UI.

Core goal

- The app must let users:

1. Select an Indian state from a dropdown containing all states of India.

2. Select a language from only two options: Hindi or English.

3. Select a speaker from only two options: Male or Female.

- After selection, the app sends a POST request to an n8n webhook with exactly these payload

keys:

- state

- language

- speaker

Important webhook response requirements

- The n8n workflow returns a payload that may contain:

- audio_base64

- audio_myme_type

- image_url

- The app must handle these fields directly and robustly.

- Audio handling:

- If audio_base64 exists, render it as a playable audio player.

- Use audio_myme_type to create the correct audio type.

- Support base64 values with or without the data URI prefix.

- If audio is returned as a direct URL instead of base64, also support that.

- Image handling:

- If image_url exists, render the image in the results view.

- Use the exact URL string returned by the webhook.

- Do not normalize, encode, decode, rewrite, sanitize, or transform the image URL before

rendering.

- Do not break valid URLs that already contain query params, percent-encoding, or special

characters.

- If the response contains nested objects or arrays, recursively search for the fields above and

extract them.

UI/UX requirements

- Create a modern, premium, atmospheric UI.

- Dark green / climate-themed aesthetic with elegant contrast.

- Make the layout responsive on desktop and mobile.

- Use clear sections:

- Header / hero

- Selection form

- Loading state

- Error state

- Results state

- Results view should show:

- The returned image at the top if available

- Audio player(s) below it

- A friendly “Campaign Ready” style status area

- Include a loading state with rotating or cycling messages.

- Include a helpful error state with a retry button.

- Make the UI feel intentional and polished, not generic.

Form behavior

- The flow should be:

1. Select state

2. Select language

3. Select speaker

4. Generate campaign

- Speaker options should only appear after language selection.

- Disable the Generate button until all required selections are made.

- Reset dependent selections when parent choices change:

- Changing state should clear language and speaker.

- Changing language should clear speaker.

- Show a compact summary of the chosen state, language, and speaker before submission.

Indian states

- The state dropdown must include all states of India.

- Do not limit it to a few states.

- Use a clean ordered list of all Indian states.

Languages

- Only allow:

- Hindi

- English

Speaker options

- Only allow:

- Male

- Female

- No celebrity names should be displayed in the selection UI.

Webhook integration

- Use a configurable webhook URL from environment variables if present.

- Fall back to a default webhook URL for local development.

- Send JSON with:

- state

- language

- speaker

- Set Content-Type to application/json.

- Handle non-200 responses gracefully.

- If the webhook returns 404, show a clear n8n-specific message explaining:

- For test webhooks, the workflow must be listening

- For live webhooks, the workflow must be active

- Handle network failures, invalid JSON, unexpected response shapes, and empty responses.

Response parsing edge cases

- Handle all of these cases:

- audio_base64 with audio_myme_type

- audio_base64 with missing mime type, defaulting to audio/mpeg

- direct audio URL

- image_url at top level

- nested image_url within arrays or objects

- nested audio fields inside arrays or objects

- response as JSON

- response as plain text

- response as binary audio file

- response as octet-stream

- response as data URI

- If audio is present, display the player.

- If only image is present, display the image gracefully.

- If both are present, show both.

- If nothing usable is found, show a friendly fallback message instead of crashing.

Audio player requirements

- Build a custom audio card or clean native player wrapper.

- Include:

- Play/pause

- Progress bar

- Duration display

- Download button

- Support multiple audio items if the response contains more than one.

- Pause other audio items when one starts playing.

- Reset playback state when returning to the form.

Image rendering requirements

- Render the returned image with:

- responsive sizing

- rounded corners

- no forced re-encoding

- no URL mutation

- If the image fails to load, show a clear fallback message or hide the broken image safely.

- Do not alter the returned URL in any way before assigning it to img src.

Accessibility and quality

- Use semantic HTML.

- Ensure buttons, selects, and interactive cards are keyboard accessible.

- Provide visible focus states.

- Use readable contrast.

- Keep the app usable without sound or image.

Implementation notes

- Use React + TypeScript.

- Keep state management simple and predictable.

- Use reusable components for header, step cards, and audio cards if helpful.

- Avoid unnecessary dependencies unless they materially improve the app.

- Keep code maintainable and production-oriented.

- Handle object URL cleanup if any blob URLs are created.

- Do not add unnecessary complexity or over-engineering.

Acceptance criteria

- Users can select a state, language, and speaker.

- The app sends { state, language, speaker } to the webhook.

- The app renders image_url exactly as received.

- The app renders audio_base64 using audio_myme_type.

- The app works even if the webhook returns nested data.

- The app does not crash on malformed responses.

- The UI looks polished and responsive.

- The final app builds successfully without TypeScript errors.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://earth-campaign-craft.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a715b9b8-ed13-4451-80a1-69e1967f291f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
