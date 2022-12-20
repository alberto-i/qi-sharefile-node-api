/**
 * Takes a string and detects if it is a valid item ID
 */
export function isItemID(str: string): boolean {
  return str.length === 36 && str.split('-').length === 5
}
