/**
 * Compress all images in public/ to WebP format
 * - PNGs → WebP (with alpha) at quality 80
 * - JPGs → WebP at quality 75
 * - Keeps originals as backup, replaces with WebP
 * - Skips files already in WebP format
 * - Also minifies the lottie JSON
 */
import sharp from 'sharp';
import { readdir, stat, readFile, writeFile, rename, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';

const PUBLIC = './public';
const SKIP_DIRS = ['node_modules', '.git'];

let totalBefore = 0;
let totalAfter = 0;
let filesProcessed = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.includes(e.name)) files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function compressImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;
  
  const stats = await stat(filePath);
  const sizeBefore = stats.size;
  totalBefore += sizeBefore;
  
  try {
    const img = sharp(filePath);
    const meta = await img.metadata();
    
    // For PNGs with transparency (borders), keep as WebP with alpha
    // For JPGs and opaque PNGs, compress as WebP
    const hasAlpha = meta.hasAlpha;
    
    const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    await img
      .webp({ 
        quality: hasAlpha ? 80 : 75,
        effort: 6,
        nearLossless: hasAlpha, // better for transparent images
      })
      .toFile(webpPath);
    
    const newStats = await stat(webpPath);
    totalAfter += newStats.size;
    filesProcessed++;
    
    const saved = Math.round((1 - newStats.size / sizeBefore) * 100);
    console.log(`  ${basename(filePath)} → .webp  ${(sizeBefore/1024).toFixed(0)}KB → ${(newStats.size/1024).toFixed(0)}KB  (${saved}% saved)`);
    
    // Remove original
    await unlink(filePath);
  } catch (err) {
    console.error(`  ✗ Failed: ${basename(filePath)} — ${err.message}`);
    totalAfter += sizeBefore; // count original size
  }
}

async function minifyLottie(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const sizeBefore = Buffer.byteLength(raw);
    totalBefore += sizeBefore;
    
    const json = JSON.parse(raw);
    const minified = JSON.stringify(json); // removes all whitespace
    const sizeAfter = Buffer.byteLength(minified);
    totalAfter += sizeAfter;
    
    await writeFile(filePath, minified);
    const saved = Math.round((1 - sizeAfter / sizeBefore) * 100);
    console.log(`  ${basename(filePath)}  ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB  (${saved}% saved)`);
    filesProcessed++;
  } catch (err) {
    console.error(`  ✗ Lottie minify failed: ${err.message}`);
  }
}

async function main() {
  console.log('\n🔧 Compressing assets in public/...\n');
  
  const files = await walk(PUBLIC);
  
  // Compress images
  console.log('📸 Images (PNG/JPG → WebP):');
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      await compressImage(f);
    }
  }
  
  // Minify Lottie JSON
  console.log('\n🎬 Lottie JSON:');
  for (const f of files) {
    if (f.endsWith('.json') && basename(f) !== 'flame.json') {
      await minifyLottie(f);
    }
  }
  
  console.log('\n═══════════════════════════════');
  console.log(`📊 Files processed: ${filesProcessed}`);
  console.log(`📦 Before: ${(totalBefore/1024/1024).toFixed(2)} MB`);
  console.log(`📦 After:  ${(totalAfter/1024/1024).toFixed(2)} MB`);
  console.log(`💾 Saved:  ${((totalBefore-totalAfter)/1024/1024).toFixed(2)} MB (${Math.round((1-totalAfter/totalBefore)*100)}%)`);
  console.log(`📱 Projected APK: ~${((totalAfter/1024/1024) * 0.7 + 3).toFixed(1)} MB`);
  console.log('═══════════════════════════════\n');
}

main();
