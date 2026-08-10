/**
 * CODER System — DOM Helper Utilities
 * 
 * Provides robust utilities for querying and interacting with the DOM,
 * including traversing through Shadow Roots (Shadow DOM).
 */

/**
 * Recursively queries elements matching a selector, traversing through all Shadow Roots.
 */
export function querySelectorAllIncludingShadow<T extends Element = Element>(
  selector: string,
  root: Document | Element | ShadowRoot = document
): T[] {
  const elements: T[] = [];

  // Query elements in current root
  const found = root.querySelectorAll(selector);
  found.forEach((el) => elements.push(el as unknown as T));

  // Find all elements with shadow roots
  const allElements = root.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el.shadowRoot) {
      const shadowElements = querySelectorAllIncludingShadow<T>(selector, el.shadowRoot);
      elements.push(...shadowElements);
    }
  });

  // Deduplicate array by reference
  return Array.from(new Set(elements));
}

/**
 * Finds a single element matching a selector, traversing through all Shadow Roots.
 */
export function querySelectorIncludingShadow<T extends Element = Element>(
  selector: string,
  root: Document | Element | ShadowRoot = document
): T | null {
  const found = root.querySelector(selector);
  if (found) return found as unknown as T;

  const allElements = root.querySelectorAll('*');
  for (const el of Array.from(allElements)) {
    if (el.shadowRoot) {
      const shadowEl = querySelectorIncludingShadow<T>(selector, el.shadowRoot);
      if (shadowEl) return shadowEl;
    }
  }

  return null;
}

/**
 * Finds the closest parent element matching a selector, even traversing outside Shadow Roots.
 */
export function findClosestIncludingShadow(
  el: Element | null,
  selector: string
): Element | null {
  if (!el) return null;

  // Try standard closest first
  const closest = el.closest(selector);
  if (closest) return closest;

  // If inside a Shadow Root, move up to the host element
  const rootNode = el.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    return findClosestIncludingShadow(rootNode.host, selector);
  }

  return null;
}
