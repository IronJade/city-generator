const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}Building Obsidian City Generator...${colors.reset}`);

try {
  // Create directory structure if it doesn't exist
  const dirs = ['dist'];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Run esbuild
  console.log(`${colors.yellow}Running esbuild...${colors.reset}`);
  execSync('node esbuild.config.mjs production', { stdio: 'inherit' });

  // Copy necessary files to dist
  console.log(`${colors.yellow}Copying files to dist...${colors.reset}`);
  
  // Copy main.js
  fs.copyFileSync('main.js', path.join('dist', 'main.js'));
  
  // Copy manifest.json
  fs.copyFileSync('manifest.json', path.join('dist', 'manifest.json'));
  
  // Copy styles.css
  fs.copyFileSync('styles.css', path.join('dist', 'styles.css'));

  console.log(`${colors.green}Build completed successfully!${colors.reset}`);
  console.log(`${colors.cyan}Files have been copied to the dist directory.${colors.reset}`);

} catch (error) {
  console.error(`${colors.red}Build failed:${colors.reset}`, error);
  process.exit(1);
}