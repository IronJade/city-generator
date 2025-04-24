# City Generator for Obsidian

A comprehensive city generation plugin for Obsidian that allows you to create detailed cities, towns, and villages for your worldbuilding or role-playing game campaigns.

## Features

- Generate cities, towns, or villages with customizable parameters
- Create a visual map of the settlement with roads, buildings, and water features
- Generate detailed information about buildings and their owners
- Include lists of wares with prices that are influenced by the local economy
- Export and import city data in JSON format
- Customize settlement types, building types, and economy factors

## How to Use

### Quick Start

1. Install the plugin from the Obsidian Community Plugins browser
2. Click the map icon in the ribbon or use the command palette to run "Generate City"
3. Enter a name for your settlement or use the "Random Name" button
4. Choose the type of settlement (Village, Town, or City)
5. Click "Generate City" to create your settlement

The plugin will create a new note containing:
- The city map
- Economic information
- Detailed building information with prices for wares
- JSON data for export/import

### Customization

You can customize many aspects of the city generation through the plugin settings:

#### Map Settings

- Map dimensions
- Road density
- Probability of water features (rivers and lakes)

#### Settlement Types

Each settlement type has:
- Population range
- Building count range
- Distribution of building types

#### Economy

The economy system affects prices of wares based on:
- Prosperity level
- Trade routes
- Local imports and exports

### Importing and Exporting

- **Export Settings**: Save your customized generation parameters
- **Import Settings**: Load previously saved parameters
- **City Data**: Each generated city includes its JSON data at the bottom of the note, which can be copied and imported later

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "City Generator"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from the [GitHub repository](https://github.com/ironjade/obsidian-city-generator)
2. Extract the files to your Obsidian plugins folder: `.obsidian/plugins/city-generator/`
3. Restart Obsidian and enable the plugin in the Community Plugins settings

## Development

This plugin is built using TypeScript and follows the Obsidian plugin structure.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ironjade/obsidian-city-generator.git

# Install dependencies
cd obsidian-city-generator
npm install

# Apply compatibility fixes (recommended for first-time setup)
npm run fix

# Build using the safer build script
npm run build:safe
```

### Available Scripts

- `npm run dev` - Start development with hot-reloading
- `npm run build` - Build the plugin for production
- `npm run build:safe` - Build with extra compatibility for older Obsidian versions
- `npm run fix` - Apply compatibility fixes for TypeScript errors
- `npm run version` - Bump versions for plugin release

### Project Structure

```
city-generator/
├── .github/workflows/    # GitHub Actions workflow files
├── src/                  # Source code
│   └── main.ts           # Main plugin code
├── styles.css            # Plugin styling
├── manifest.json         # Obsidian plugin manifest
├── package.json          # NPM package configuration
├── tsconfig.json         # TypeScript configuration
├── esbuild.config.mjs    # Build configuration
└── versions.json         # Version compatibility information
```

### Troubleshooting TypeScript Errors

If you encounter TypeScript errors related to @types/node or @codemirror, try the following:

1. Use the alternative build script that skips type checking:
   ```bash
   node build.js
   ```

2. If errors persist, use a specific version of TypeScript that's compatible with Obsidian:
   ```bash
   npm install typescript@4.4.4 @types/node@16.11.6 --save-exact
   ```

3. For CodeMirror "type keyword in exports" errors, modify your build process to bypass TypeScript checking with:
   ```bash
   npm install esbuild@0.17.19 --save-exact
   node esbuild.config.mjs production
   ```

4. As a last resort, you can temporarily disable type checking for the CodeMirror modules by adding them to the `exclude` array in tsconfig.json:
   ```json
   "exclude": [
     "node_modules/**/*",
     "node_modules/@codemirror/**/*"
   ]
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.