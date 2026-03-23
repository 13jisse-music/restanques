const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = './public/sprites/chatgpt';
const OUT = './public/sprites/game';

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Remove dark/gray background: pixels where R<50 && G<50 && B<50 → transparent
async function removeGrayBg(inputPath) {
  const meta = await sharp(inputPath).ensureAlpha().metadata();
  const rgba = await sharp(inputPath).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i], g = rgba[i+1], b = rgba[i+2];
    // Gray/dark bg detection: low saturation + medium brightness
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.2 && max > 60 && max < 200) {
      rgba[i+3] = 0;
    }
    if (r < 45 && g < 45 && b < 45) {
      rgba[i+3] = 0;
    }
  }
  return { data: rgba, width: meta.width, height: meta.height };
}

// Cut a grid from an image, output to OUT/prefix_R_C.png, resize to targetSize
async function cutGrid(inputPath, cols, rows, prefix, targetSize = 64, cleanBg = false) {
  const dir = path.join(OUT, prefix);
  await ensureDir(dir);

  let meta, buffer;
  if (cleanBg) {
    const cleaned = await removeGrayBg(inputPath);
    meta = { width: cleaned.width, height: cleaned.height };
    buffer = cleaned.data;
  }

  const srcMeta = await sharp(inputPath).metadata();
  const cellW = Math.floor(srcMeta.width / cols);
  const cellH = Math.floor(srcMeta.height / rows);

  const results = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const outFile = path.join(dir, `${r}_${c}.png`);
      if (cleanBg) {
        // Extract from cleaned buffer
        const extracted = await sharp(buffer, { raw: { width: meta.width, height: meta.height, channels: 4 } })
          .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
          .resize(targetSize, targetSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png().toFile(outFile);
      } else {
        await sharp(inputPath)
          .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
          .resize(targetSize, targetSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png().toFile(outFile);
      }
      results.push(outFile);
    }
  }
  console.log(`✅ ${prefix}: ${cols}x${rows} → ${results.length} files (${targetSize}px)`);
}

// Cut a single row of sprites
async function cutRow(inputPath, count, prefix, targetSize = 64, cleanBg = false) {
  return cutGrid(inputPath, count, 1, prefix, targetSize, cleanBg);
}

// Assemble individual sprites back into a single spritesheet
async function assembleSheet(dir, prefix, cols, rows, targetSize, outputPath) {
  const width = cols * targetSize;
  const height = rows * targetSize;
  const composites = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const file = path.join(dir, `${r}_${c}.png`);
      if (fs.existsSync(file)) {
        composites.push({ input: file, left: c * targetSize, top: r * targetSize });
      }
    }
  }

  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png().toFile(outputPath);

  console.log(`📦 Assembled: ${outputPath} (${cols}x${rows} @ ${targetSize}px)`);
}

// Assemble a row of sprites
async function assembleRow(dir, count, targetSize, outputPath) {
  const composites = [];
  for (let i = 0; i < count; i++) {
    const file = path.join(dir, `0_${i}.png`);
    if (fs.existsSync(file)) {
      composites.push({ input: file, left: i * targetSize, top: 0 });
    }
  }
  await sharp({ create: { width: count * targetSize, height: targetSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png().toFile(outputPath);
  console.log(`📦 Assembled row: ${outputPath} (${count} @ ${targetSize}px)`);
}

async function main() {
  await ensureDir(OUT);

  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png')).sort();

  // Map files by timestamp
  const fileMap = {};
  files.forEach(f => {
    const match = f.match(/23_(\d+_\d+)/);
    if (match) fileMap[match[1]] = path.join(SRC, f);
  });

  console.log('Found files:', Object.keys(fileMap));

  // 1. JISSE — 4×3 grid, transparent bg
  if (fileMap['32_04']) {
    await cutGrid(fileMap['32_04'], 4, 3, 'jisse', 64);
    await assembleSheet(path.join(OUT, 'jisse'), '', 4, 3, 64, path.join(OUT, 'jisse.png'));
  }

  // 2. MÉLANIE — 4×3 grid, transparent bg
  if (fileMap['32_06']) {
    await cutGrid(fileMap['32_06'], 4, 3, 'melanie', 64);
    await assembleSheet(path.join(OUT, 'melanie'), '', 4, 3, 64, path.join(OUT, 'melanie.png'));
  }

  // 3. GEMMES — 6 in row, GRAY BG to remove
  if (fileMap['32_09']) {
    await cutRow(fileMap['32_09'], 6, 'gems', 64, true);
    await assembleRow(path.join(OUT, 'gems'), 6, 64, path.join(OUT, 'gems.png'));
  }

  // 4. MONSTRES — 5 in row, GRAY BG
  if (fileMap['32_11']) {
    await cutRow(fileMap['32_11'], 5, 'monsters', 64, true);
    await assembleRow(path.join(OUT, 'monsters'), 5, 64, path.join(OUT, 'monsters.png'));
  }

  // 5. ITEMS — 4×4 grid, transparent bg
  if (fileMap['32_43']) {
    await cutGrid(fileMap['32_43'], 4, 4, 'items', 64);
    await assembleSheet(path.join(OUT, 'items'), '', 4, 4, 64, path.join(OUT, 'items.png'));
  }

  // 6. OUTILS — 5 in row, transparent bg
  if (fileMap['39_26']) {
    await cutRow(fileMap['39_26'], 5, 'tools', 64);
    await assembleRow(path.join(OUT, 'tools'), 5, 64, path.join(OUT, 'tools.png'));
  }

  // 7. BÂTIMENTS — 3×2 grid, transparent bg
  if (fileMap['39_30']) {
    await cutGrid(fileMap['39_30'], 3, 2, 'buildings', 96);
    await assembleSheet(path.join(OUT, 'buildings'), '', 3, 2, 96, path.join(OUT, 'buildings.png'));
  }

  // 8. NATURE — 4 in row (tree, tree, rock, bush), transparent bg
  if (fileMap['40_46']) {
    await cutRow(fileMap['40_46'], 4, 'nature', 64);
    await assembleRow(path.join(OUT, 'nature'), 4, 64, path.join(OUT, 'nature.png'));
  }

  // 9. TILES SOL — 6×5 grid, transparent bg
  if (fileMap['41_42']) {
    await cutGrid(fileMap['41_42'], 6, 5, 'tiles', 64);
    await assembleSheet(path.join(OUT, 'tiles'), '', 6, 5, 64, path.join(OUT, 'tiles.png'));
  }

  // 10. ICÔNES MENU — 7 in row, GRAY BG
  if (fileMap['47_20']) {
    await cutRow(fileMap['47_20'], 7, 'icons', 64, true);
    await assembleRow(path.join(OUT, 'icons'), 7, 64, path.join(OUT, 'icons.png'));
  }

  console.log('\n🎉 All sprites processed!');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
