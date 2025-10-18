/**
 * Array Utilities
 *
 * Utility functions for array manipulation and operations.
 * Provides common array operations used throughout the app.
 */

/**
 * Remove duplicate values from array
 * @param array - The array to process
 * @returns Array with unique values
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Remove duplicate objects by key
 * @param array - Array of objects
 * @param key - Key to use for uniqueness
 * @returns Array with unique objects
 */
export const uniqueBy = <T extends Record<string, any>>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Group array of objects by key
 * @param array - Array of objects
 * @param key - Key to group by
 * @returns Object with grouped arrays
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Chunk array into smaller arrays
 * @param array - The array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten nested array one level
 * @param array - The array to flatten
 * @returns Flattened array
 */
export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((acc, val) => {
    return acc.concat(Array.isArray(val) ? val : [val]);
  }, []);
};

/**
 * Flatten deeply nested array
 * @param array - The array to flatten
 * @returns Deeply flattened array
 */
export const flattenDeep = <T>(array: any[]): T[] => {
  return array.reduce<T[]>((acc, val) => {
    return acc.concat(Array.isArray(val) ? flattenDeep(val) : [val]);
  }, []);
};

/**
 * Shuffle array randomly
 * @param array - The array to shuffle
 * @returns Shuffled array
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get random item from array
 * @param array - The array to pick from
 * @returns Random item
 */
export const sample = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get multiple random items from array
 * @param array - The array to pick from
 * @param count - Number of items to pick
 * @returns Array of random items
 */
export const sampleSize = <T>(array: T[], count: number): T[] => {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Sort array of objects by key
 * @param array - Array of objects
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export const sortBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Find differences between two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Items in array1 but not in array2
 */
export const difference = <T>(array1: T[], array2: T[]): T[] => {
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
};

/**
 * Find intersection of two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Items present in both arrays
 */
export const intersection = <T>(array1: T[], array2: T[]): T[] => {
  const set2 = new Set(array2);
  return unique(array1.filter(item => set2.has(item)));
};

/**
 * Find union of two arrays (all unique items)
 * @param array1 - First array
 * @param array2 - Second array
 * @returns All unique items from both arrays
 */
export const union = <T>(array1: T[], array2: T[]): T[] => {
  return unique([...array1, ...array2]);
};

/**
 * Partition array into two arrays based on condition
 * @param array - The array to partition
 * @param predicate - Function to test each element
 * @returns Tuple of [matching, nonMatching]
 */
export const partition = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): [T[], T[]] => {
  const matching: T[] = [];
  const nonMatching: T[] = [];

  array.forEach((item, index) => {
    if (predicate(item, index)) {
      matching.push(item);
    } else {
      nonMatching.push(item);
    }
  });

  return [matching, nonMatching];
};

/**
 * Get first n items from array
 * @param array - The array
 * @param count - Number of items to take
 * @returns First n items
 */
export const take = <T>(array: T[], count: number): T[] => {
  return array.slice(0, count);
};

/**
 * Get last n items from array
 * @param array - The array
 * @param count - Number of items to take
 * @returns Last n items
 */
export const takeLast = <T>(array: T[], count: number): T[] => {
  return array.slice(-count);
};

/**
 * Remove falsy values from array
 * @param array - The array to compact
 * @returns Array without falsy values
 */
export const compact = <T>(array: (T | null | undefined | false | 0 | '')[]): T[] => {
  return array.filter(Boolean) as T[];
};

/**
 * Count occurrences of each value
 * @param array - The array to count
 * @returns Object with counts
 */
export const countBy = <T>(array: T[]): Record<string, number> => {
  return array.reduce((counts, item) => {
    const key = String(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
};

/**
 * Find index of item by predicate
 * @param array - The array to search
 * @param predicate - Function to test each element
 * @returns Index of found item or -1
 */
export const findIndex = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): number => {
  return array.findIndex(predicate);
};

/**
 * Find last index of item by predicate
 * @param array - The array to search
 * @param predicate - Function to test each element
 * @returns Index of found item or -1
 */
export const findLastIndex = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): number => {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i)) {
      return i;
    }
  }
  return -1;
};

/**
 * Sum of array numbers
 * @param array - Array of numbers
 * @returns Sum of all numbers
 */
export const sum = (array: number[]): number => {
  return array.reduce((total, num) => total + num, 0);
};

/**
 * Average of array numbers
 * @param array - Array of numbers
 * @returns Average of all numbers
 */
export const average = (array: number[]): number => {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
};

/**
 * Find minimum value in array
 * @param array - Array of numbers
 * @returns Minimum value
 */
export const min = (array: number[]): number | undefined => {
  if (array.length === 0) return undefined;
  return Math.min(...array);
};

/**
 * Find maximum value in array
 * @param array - Array of numbers
 * @returns Maximum value
 */
export const max = (array: number[]): number | undefined => {
  if (array.length === 0) return undefined;
  return Math.max(...array);
};

/**
 * Create range of numbers
 * @param start - Start number
 * @param end - End number
 * @param step - Step increment (default: 1)
 * @returns Array of numbers in range
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }
  return result;
};

/**
 * Check if array is empty
 * @param array - The array to check
 * @returns True if empty
 */
export const isEmpty = <T>(array: T[] | null | undefined): boolean => {
  return !array || array.length === 0;
};

/**
 * Check if array is not empty
 * @param array - The array to check
 * @returns True if not empty
 */
export const isNotEmpty = <T>(array: T[] | null | undefined): boolean => {
  return !isEmpty(array);
};

/**
 * Move item in array from one index to another
 * @param array - The array
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @returns New array with moved item
 */
export const move = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Insert item at specific index
 * @param array - The array
 * @param index - Index to insert at
 * @param item - Item to insert
 * @returns New array with inserted item
 */
export const insert = <T>(array: T[], index: number, item: T): T[] => {
  const result = [...array];
  result.splice(index, 0, item);
  return result;
};

/**
 * Remove item at specific index
 * @param array - The array
 * @param index - Index to remove at
 * @returns New array with removed item
 */
export const remove = <T>(array: T[], index: number): T[] => {
  const result = [...array];
  result.splice(index, 1);
  return result;
};

/**
 * Toggle item in array (add if not present, remove if present)
 * @param array - The array
 * @param item - Item to toggle
 * @returns New array with toggled item
 */
export const toggle = <T>(array: T[], item: T): T[] => {
  const index = array.indexOf(item);
  if (index === -1) {
    return [...array, item];
  }
  return remove(array, index);
};
