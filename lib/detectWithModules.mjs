import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Auto-detects if the current directory contains with-* module patterns
 * @param {string} baseDir - Directory to check (defaults to CWD)
 * @returns {boolean} True if with-* modules detected
 */
export function hasWithModules(baseDir = process.cwd()) {
  try {
    const srcDir = join(baseDir, 'src');
    if (!existsSync(srcDir)) return false;
    
    // Check for with-* directories in src
    const entries = readdirSync(srcDir, { withFileTypes: true });
    return entries.some(entry => 
      entry.isDirectory() && entry.name.startsWith('with-')
    );
  } catch {
    return false;
  }
}

/**
 * Detect with-* modules and return configuration recommendation
 * @param {string} baseDir - Directory to check
 * @returns {Object} Detection result and recommendation
 */
export function detectWithModulesConfig(baseDir = process.cwd()) {
  const hasWith = hasWithModules(baseDir);
  
  return {
    detected: hasWith,
    recommended: hasWith ? './eslint.config.js' : './eslint.config.js', // Same file, different auto-detection
    configTemplate: hasWith ? 'auto-detect' : 'auto-detect', // Both use auto-detection now
    message: hasWith 
      ? 'with-* modules detected. ESLint will automatically apply architectural restrictions.'
      : 'No with-* modules detected. Using base ESLint configuration.'
  };
}