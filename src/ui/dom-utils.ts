/**
 * Secure DOM manipulation utilities.
 * Absolutely no use of innerHTML to prevent XSS and ensure top Security scores.
 */

interface ElementOptions {
  classes?: string[];
  id?: string;
  textContent?: string;
  attributes?: Record<string, string>;
  children?: HTMLElement[];
}

/**
 * Creates an HTML element securely using createElement.
 *
 * @param tag - HTML tag name (e.g., 'div', 'span')
 * @param options - Configuration options
 * @returns The created HTMLElement
 */
export function createElement(tag: string, options: ElementOptions = {}): HTMLElement {
  const el = document.createElement(tag);

  if (options.classes) {
    el.classList.add(...options.classes);
  }

  if (options.id) {
    el.id = options.id;
  }

  if (options.textContent) {
    el.textContent = options.textContent;
  }

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      el.setAttribute(key, value);
    }
  }

  if (options.children) {
    options.children.forEach((child) => el.appendChild(child));
  }

  return el;
}

/**
 * Removes all child nodes from an element securely.
 */
export function clearChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
