# SwastiQ – full-app language switching

Languages (same as the login chooser): Tamil `ta`, Hindi `hi`, Telugu `te`, Kannada `kn`,
Malayalam `ml`, Marathi `mr`, Gujarati `gu`, English `en`.

## Files
- `i18n.js`   – the language engine (framework-agnostic, no dependencies)
- `demo.html` – open in a browser to see it work on sample SwastiQ screens

## Add to your app
1. Copy `i18n.js` into your project's public folder and load it BEFORE your app script:
   `<script src="/i18n.js"></script>`
2. In the login language chooser, on each card call `I18N.setLang('ta')` (etc.),
   or add `data-set-lang="ta"` to the card.
3. Make the header language button ("Tamil") open the same chooser / call `I18N.setLang(code)`.
4. Remove your old Tamil-only translation code so it does not replace English text first.
5. Text built in JavaScript (toasts, alerts, TTS): `I18N.t("Contact the PHC immediately.")`
   and `I18N.t("Welcome Back, {name}", { name })`.
6. Voice (Gnani STT/TTS) language code: `I18N.speechLocale()` e.g. `hi-IN`.

## Rules built in
- Login page is never translated (`I18N.config.skipPage` – edit if your login route differs).
- Add `data-no-i18n` to anything that must stay as-is (patient names, user data).
- Missing translation => English is shown. Run `I18N.missing()` in the browser console
  to list strings still in English, then add them with:
  `I18N.extend({ "English text": { ta: "...", hi: "...", te: "...", kn: "...", ml: "...", mr: "...", gu: "..." } })`

## Please review
Have a native speaker check the alert / protocol wording before real clinical use.
