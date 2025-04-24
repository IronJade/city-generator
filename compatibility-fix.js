/**
 * This script creates a compatibility fix for Obsidian plugin development
 * It addresses TypeScript errors that commonly occur with @types/node and CodeMirror
 */

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

console.log(`${colors.cyan}Applying compatibility fixes for Obsidian plugin development...${colors.reset}`);

// Create a .npmrc file with specific settings
try {
  const npmrcContent = `engine-strict=true
legacy-peer-deps=true
save-exact=true`;

  fs.writeFileSync('.npmrc', npmrcContent);
  console.log(`${colors.green}Created .npmrc file with compatibility settings${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to create .npmrc:${colors.reset}`, error);
}

// Create a file to suppress TypeScript errors for @codemirror modules
try {
  const cmIgnoreDir = path.join('src', '@types');
  
  if (!fs.existsSync(cmIgnoreDir)) {
    fs.mkdirSync(cmIgnoreDir, { recursive: true });
    console.log(`${colors.green}Created @types directory${colors.reset}`);
  }
  
  const codemirrorDtsContent = `
/**
 * This is a declaration file to suppress TypeScript errors with CodeMirror modules
 */

declare module '@codemirror/state' {
  const content: any;
  export = content;
  export const Annotation: any;
  export const AnnotationType: any;
  export const ChangeDesc: any;
  export const ChangeSet: any;
  export const CharCategory: any;
  export const Compartment: any;
  export const EditorSelection: any;
  export const EditorState: any;
  export const Facet: any;
  export const Line: any;
  export const MapMode: any;
  export const Prec: any;
  export const Range: any;
  export const RangeSet: any;
  export const RangeSetBuilder: any;
  export const RangeValue: any;
  export const SelectionRange: any;
  export const StateEffect: any;
  export const StateEffectType: any;
  export const StateField: any;
  export const Text: any;
  export const Transaction: any;
}

declare module '@codemirror/view' {
  const content: any;
  export = content;
}

declare module '@codemirror/language' {
  const content: any;
  export = content;
}

declare module '@codemirror/commands' {
  const content: any;
  export = content;
}

declare module '@codemirror/search' {
  const content: any;
  export = content;
}

declare module '@codemirror/autocomplete' {
  const content: any;
  export = content;
}
`;
  
  fs.writeFileSync(path.join(cmIgnoreDir, 'codemirror.d.ts'), codemirrorDtsContent);
  console.log(`${colors.green}Created TypeScript declarations to suppress CodeMirror errors${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to create CodeMirror type definitions:${colors.reset}`, error);
}

console.log(`${colors.cyan}Compatibility fixes applied. Try building your plugin with 'npm run build:safe'${colors.reset}`);