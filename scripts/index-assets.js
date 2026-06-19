import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicSwPath = path.join(projectRoot, 'public', 'sw.js');
const distSwPath = path.join(projectRoot, 'dist', 'sw.js');

// Helper to recursively get files
function getFilesRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run build first.');
  process.exit(1);
}

// Get all files in dist/ and convert to relative paths
const allFiles = getFilesRecursive(distDir);
const assets = allFiles
  .map(file => {
    const relativePath = path.relative(distDir, file);
    // Standardize path separators to forward slash (for Windows compatibility)
    return relativePath.replace(/\\/g, '/');
  })
  .filter(file => {
    // Exclude sw.js itself and any map files or other system files
    return file !== 'sw.js' && !file.endsWith('.map') && !file.startsWith('.');
  })
  .map(file => `./${file}`);

// Add "./" to assets to cache the root path
assets.unshift('./');

// Sort assets for cleaner output and deterministic caching order
assets.sort();

console.log('Scanned assets to cache:', assets);

const assetsString = `const ASSETS_TO_CACHE = [\n${assets.map(asset => `  "${asset}"`).join(',\n')}\n];`;

const updateSwFile = (swPath) => {
  if (!fs.existsSync(swPath)) {
    console.warn(`Warning: Service worker file not found at ${swPath}`);
    return;
  }
  
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace the ASSETS_TO_CACHE array definition
  const regex = /const\s+ASSETS_TO_CACHE\s*=\s*\[[\s\S]*?\];/;
  
  if (regex.test(swContent)) {
    swContent = swContent.replace(regex, assetsString);
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`Successfully updated ${swPath}`);
  } else {
    console.error(`Error: Could not find ASSETS_TO_CACHE array in ${swPath}`);
  }
};

updateSwFile(publicSwPath);
updateSwFile(distSwPath);
