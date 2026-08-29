// Normalize local filenames and remote logo definitions into the string format
// expected by the original app.js renderer.
for (const country of Object.values(ASSETS_DATA)) {
  country.files = country.files.map((file) =>
    typeof file === "string" ? file : file.src,
  );
}
