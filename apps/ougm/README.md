# Olympia Union Gospel Mission workspace

Workspace UI and domain definitions live in `apps/ougm`; the existing Blended Works Next.js deployment serves `/apps/ougm` from `apps/web/app/apps/ougm` so it shares Clerk and platform administrator access.

Access: existing `BLENDED_WORKS_ADMIN_EMAILS` automatically grants access and publishing. Verified staff emails can be configured in `OUGM_STAFF_EMAILS` (comma-separated); staff can draft but only platform admins publish.

Security entries exist only in component memory. No application storage, Sanity, or analytics receives typed entries. Optional dictation sends audio through the server to OpenAI, then returns text to the active field; audio is not saved by the app. Closing the dialog clears entries, including after printing. Cancelling print keeps the editor available until closed. Browser print cannot report whether a physical printer succeeded. Official templates and linked PDF downloads await the user's PDFs.

Calendar records persist on this device under a user-specific browser key. This first version does not synchronize schedules between devices. Security forms and devotional drafts never use that key.

Dictation uses OpenAI through a server-side API key and `gpt-4o-mini-transcribe` (override with `OUGM_TRANSCRIPTION_MODEL`). Recording is opt-in, capped at 60 seconds / 4 MB, and cleared after transcription. Closing a form stops recording and aborts pending client requests. Devotional chat uses the existing server-side OpenAI key (`OPENAI_API_SECRET_KEY` or `OPENAI_API_KEY`); generated drafts are editable and publish through the existing `saveDevotional` action only on an explicit administrator click. No automatic publishing from AI text.
