Self-host fonts for carga-datos-vue

Place Poppins woff2 files here with these filenames (recommended weights):

- poppins-300.woff2 (font-weight: 300)
- poppins-400.woff2 (font-weight: 400)
- poppins-600.woff2 (font-weight: 600)
- poppins-700.woff2 (font-weight: 700)

Where to obtain files:

- Google Fonts: https://fonts.google.com/specimen/Poppins -> Download family -> extract woff2 files
- Or generate optimized subsets with Google Webfont Helper: https://google-webfonts-helper.herokuapp.com/fonts/poppins

After placing the files in `public/fonts/`, restart the dev server. The project already includes `@font-face` rules in `src/index.css` pointing to `/fonts/poppins-*.woff2`.

Notes:

- Use woff2 for modern browsers. If you need broader compatibility, add woff files and additional `src` fallbacks.
- For production consider serving fonts with proper Cache-Control headers (via your hosting provider) and subsetting to reduce size.
