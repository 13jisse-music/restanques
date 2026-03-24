const OpenAI = require("openai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const https = require("https");

const API_KEY = "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";
const OUT = "./public/sprites/generated";
const openai = new OpenAI({ apiKey: API_KEY });

const STYLE = "Pixel art, 16-bit retro RPG style like Stardew Valley, single subject centered on pure white background, clean dark outlines, no text, no shadows on background";

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => { res.pipe(file); file.on("finish", () => { file.close(); resolve(); }); }).on("error", reject);
  });
}

async function removeWhiteBg(inputPath, outputPath, size = 64) {
  const rgba = await sharp(inputPath).ensureAlpha().resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).raw().toBuffer();
  const meta = { width: size, height: size };
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] > 235 && rgba[i + 1] > 235 && rgba[i + 2] > 235) rgba[i + 3] = 0;
  }
  await sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } }).png().toFile(outputPath);
}

async function generate(name, prompt, size = 64) {
  const outFile = path.join(OUT, `${name}.png`);
  if (fs.existsSync(outFile)) { console.log(`⏭️ SKIP ${name} (exists)`); return true; }

  console.log(`🎨 Generating ${name}...`);
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", prompt: `${STYLE}. ${prompt}`,
      n: 1, size: "1024x1024", quality: "standard",
    });
    const url = response.data[0].url;
    const tmpFile = path.join(OUT, `_tmp_${name}.png`);
    await downloadFile(url, tmpFile);
    await removeWhiteBg(tmpFile, outFile, size);
    fs.unlinkSync(tmpFile);
    console.log(`✅ ${name} (${size}px)`);
    return true;
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    return false;
  }
}

async function assembleRow(names, outFile, cellSize = 64) {
  const composites = [];
  for (let i = 0; i < names.length; i++) {
    const f = path.join(OUT, `${names[i]}.png`);
    if (fs.existsSync(f)) composites.push({ input: f, left: i * cellSize, top: 0 });
  }
  if (composites.length === 0) return;
  await sharp({ create: { width: names.length * cellSize, height: cellSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).png().toFile(outFile);
  console.log(`📦 ${path.basename(outFile)}`);
}

async function assembleGrid(names, cols, outFile, cellSize = 64) {
  const rows = Math.ceil(names.length / cols);
  const composites = [];
  for (let i = 0; i < names.length; i++) {
    const f = path.join(OUT, `${names[i]}.png`);
    if (fs.existsSync(f)) composites.push({ input: f, left: (i % cols) * cellSize, top: Math.floor(i / cols) * cellSize });
  }
  if (composites.length === 0) return;
  await sharp({ create: { width: cols * cellSize, height: rows * cellSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).png().toFile(outFile);
  console.log(`📦 ${path.basename(outFile)}`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  ensureDir(OUT);
  let count = 0;

  // ─── PRIORITÉ 1 : GEMMES (6) ───
  const gemPrompts = [
    ["gem_purple", "polished purple amethyst gem faceted sparkle highlight, puzzle game icon"],
    ["gem_green", "polished green emerald gem faceted sparkle, puzzle game icon"],
    ["gem_red", "polished red ruby gem faceted sparkle, puzzle game icon"],
    ["gem_blue", "polished blue sapphire gem faceted sparkle, puzzle game icon"],
    ["gem_yellow", "polished golden topaz gem faceted sparkle, puzzle game icon"],
    ["gem_orange", "polished orange fire opal gem faceted sparkle, puzzle game icon"],
  ];
  for (const [name, prompt] of gemPrompts) {
    if (await generate(name, prompt)) count++;
    await sleep(3000);
  }
  await assembleRow(gemPrompts.map(g => g[0]), path.join(OUT, "gems.png"));

  // ─── PRIORITÉ 2 : ITEMS (16) ───
  const itemPrompts = [
    ["item_branche", "wooden branch with small green leaves, RPG inventory icon"],
    ["item_herbe", "bunch of wild green herbs tied with string, RPG inventory icon"],
    ["item_lavande", "bouquet of purple lavender flowers, RPG inventory icon"],
    ["item_pierre", "smooth grey round stone, RPG inventory icon"],
    ["item_coquillage", "pink spiral conch seashell, RPG inventory icon"],
    ["item_sel", "white translucent salt crystal cluster, RPG inventory icon"],
    ["item_fer", "dark iron ore chunk with silver veins, RPG inventory icon"],
    ["item_ocre", "bright orange ochre pigment in small clay bowl, RPG inventory icon"],
    ["item_cristal", "faceted blue crystal gem glowing cyan, RPG inventory icon"],
    ["item_poisson", "fresh silver-blue whole fish side view, RPG inventory icon"],
    ["item_perle", "round white iridescent pearl soft glow, RPG inventory icon"],
    ["item_corail", "branching red coral piece, RPG inventory icon"],
    ["item_pain", "golden rustic bread loaf scored top, RPG inventory icon"],
    ["item_potion", "purple healing potion glass bottle with cork, RPG inventory icon"],
    ["item_cle", "ornate golden ancient key with mystical glow, RPG inventory icon"],
    ["item_sac", "brown leather adventurer backpack with buckles, RPG inventory icon"],
  ];
  for (const [name, prompt] of itemPrompts) {
    if (await generate(name, prompt)) count++;
    await sleep(3000);
  }
  await assembleGrid(itemPrompts.map(i => i[0]), 4, path.join(OUT, "items.png"));

  // ─── PRIORITÉ 3 : MONSTRES BOSS (5 × 128px) ───
  const bossPrompts = [
    ["mob_sanglier_idle", "giant brown wild boar with massive tusks glowing red eyes, RPG BOSS monster"],
    ["mob_mouette_boss_idle", "giant eagle-seagull hybrid massive wingspan, RPG BOSS"],
    ["mob_tarasque_idle", "green dragon-turtle with spiky shell and small wings, RPG BOSS"],
    ["mob_pieuvre_idle", "giant purple octopus with huge tentacles and one angry eye, RPG BOSS"],
    ["mob_mistral_idle", "massive blue-white wind tornado with angry demonic face, FINAL BOSS"],
  ];
  for (const [name, prompt] of bossPrompts) {
    if (await generate(name, prompt, 128)) count++;
    await sleep(3000);
  }

  // ─── PRIORITÉ 4 : NATURE (4) ───
  const naturePrompts = [
    ["nature_chene", "green oak tree round leafy canopy, top-down RPG view"],
    ["nature_sapin", "green pine tree triangular shape, top-down RPG view"],
    ["nature_rocher", "large grey stone boulder, top-down RPG view"],
    ["nature_buisson", "flowering bush white and pink flowers, top-down RPG view"],
  ];
  for (const [name, prompt] of naturePrompts) {
    if (await generate(name, prompt)) count++;
    await sleep(3000);
  }
  await assembleRow(naturePrompts.map(n => n[0]), path.join(OUT, "nature.png"));

  console.log(`\n🎉 Generated ${count} sprites! Total cost: ~$${(count * 0.04).toFixed(2)}`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
