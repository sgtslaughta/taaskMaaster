/**
 * @fileoverview Class name utility for the TaaskMaaster design system
 * @description Utility function for merging class names with proper Tailwind CSS optimization
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @description Merges class names with proper Tailwind CSS optimization
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
