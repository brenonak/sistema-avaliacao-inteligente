/**
 * Utility functions for generating and validating access codes
 */

// Characters allowed in generated codes (letters and numbers)
// Case-insensitive: uppercase only for consistency
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a random alphanumeric code of specified length
 * Uses uppercase letters and numbers only for case-insensitive compatibility
 * 
 * @param length - Length of code to generate (default: 6)
 * @returns Random alphanumeric code
 */
export function generateAccessCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Validates an access code format
 * 
 * @param code - Code to validate
 * @param expectedLength - Expected length (default: 6)
 * @returns true if valid, false otherwise
 */
export function isValidAccessCode(code: string, expectedLength: number = 6): boolean {
  if (!code || typeof code !== 'string') return false;
  
  const upperCode = code.toUpperCase();
  
  // Check length
  if (upperCode.length !== expectedLength) return false;
  
  // Check all characters are alphanumeric
  return /^[A-Z0-9]+$/.test(upperCode);
}

/**
 * Normalizes an access code (uppercase for comparison)
 * 
 * @param code - Code to normalize
 * @returns Normalized code (uppercase)
 */
export function normalizeAccessCode(code: string): string {
  return code.toUpperCase().trim();
}
