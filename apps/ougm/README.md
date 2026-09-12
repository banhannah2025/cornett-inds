# Olympia Union Gospel Mission workspace

Workspace UI and domain definitions live in `apps/ougm`; the existing Blended Works Next.js deployment serves `/apps/ougm` from `apps/web/app/apps/ougm` so it shares Clerk and platform administrator access.

Access: existing `BLENDED_WORKS_ADMIN_EMAILS` automatically grants access and publishing. Verified staff emails can be configured in `OUGM_STAFF_EMAILS` (comma-separated); staff can draft but only platform admins publish.

Security entries exist only in component memory. No application storage, Sanity, or analytics receives typed entries. Optional dictation sends audio through the server to OpenAI, then returns text to the active field; audio is not saved by the app. Closing the dialog clears entries, including after printing. Cancelling print keeps the editor available until closed. Browser print cannot report whether a physical printer succeeded. The Security: Incident Report template recreates the supplied Mission PDF. Its linked blank PDF has interactive fields; printing in the browser uses the original artwork and adds continuation pages for overflowing entries. Prepared report URLs are revoked on edits and on close.

Calendar records persist on this device under a user-specific browser key. This first version does not synchronize schedules between devices. Security forms and devotional drafts never use that key.

Dictation uses OpenAI through a server-side API key and `gpt-4o-mini-transcribe` (override with `OUGM_TRANSCRIPTION_MODEL`). Recording is opt-in, capped at 60 seconds / 4 MB, and cleared after transcription. Closing a form stops recording and aborts pending client requests. Devotional chat uses the existing server-side OpenAI key (`OPENAI_API_SECRET_KEY` or `OPENAI_API_KEY`); generated drafts are editable and publish through the existing `saveDevotional` action only on an explicit administrator click. No automatic publishing from AI text.

Security Shift Notes / Security Log uses the two-sided Mission template. Staff enter shift beginning/end and add or remove rows containing date, time, initials, and notes. Date/time controls use browser pickers. Long notes flow into more ruled rows; logs exceeding 50 physical rows add pages using the same artwork. Printed copies include at least the two supplied sides. Two-sided printing is selected in the printer dialog. The linked blank PDF contains 204 interactive fields across both sides.

Shelter Sign-In Log preserves the supplied male/female sides: 50 male name slots, 38 female slots, separate side dates, and five quarantine name/location rows. Its linked blank PDF has 100 interactive fields. Long typed values receive labeled continuation pages.

Staff shifts are calendar records with staff name, role, start/end dates and times, and notes. The monthly roster supports staff filtering, editing, deleting, and overnight coverage on the daily calendar. These records share the existing account-specific device storage; this is not a shared staff schedule between accounts or devices.

Weekly Spiritual Outcomes uses the supplied landscape Mission artwork, Monday–Sunday counts, optional daily date headings and recovery meeting names, and automatic weekly totals in the app. Dates use native pickers. Blank counts stay blank. Numeric cells accept whole numbers from 0 to 99999. The linked blank PDF has 119 interactive fields; its totals are entered manually when using a standalone PDF viewer. App entries use the same clear-on-close lifecycle as other forms.
