// Normalize every asset into { name, src } so app.js can handle local and remote logos.
for (const country of Object.values(ASSETS_DATA)) {
  country.files = country.files.map((file) => {
    if (typeof file === "string") return { name: file, src: `assets/${Object.keys(ASSETS_DATA).find((key) => ASSETS_DATA[key] === country)}/${file}` };
    return file;
  });
}
