import { createElement, clearChildren } from '../src/ui/dom-utils';

describe('DOM Utils', () => {
  it('should create an element with specified tag', () => {
    const el = createElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('should add classes', () => {
    const el = createElement('span', { classes: ['class-a', 'class-b'] });
    expect(el.classList.contains('class-a')).toBe(true);
    expect(el.classList.contains('class-b')).toBe(true);
  });

  it('should add id', () => {
    const el = createElement('div', { id: 'test-id' });
    expect(el.id).toBe('test-id');
  });

  it('should add textContent', () => {
    const el = createElement('p', { textContent: 'Hello World' });
    expect(el.textContent).toBe('Hello World');
  });

  it('should add attributes', () => {
    const el = createElement('a', { attributes: { href: 'https://example.com', target: '_blank' } });
    expect(el.getAttribute('href')).toBe('https://example.com');
    expect(el.getAttribute('target')).toBe('_blank');
  });

  it('should append children', () => {
    const child1 = createElement('span');
    const child2 = createElement('strong');
    const parent = createElement('div', { children: [child1, child2] });
    expect(parent.children.length).toBe(2);
    expect(parent.children[0]).toBe(child1);
    expect(parent.children[1]).toBe(child2);
  });

  it('should clear children securely', () => {
    const parent = document.createElement('div');
    parent.appendChild(document.createElement('span'));
    parent.appendChild(document.createElement('strong'));
    expect(parent.children.length).toBe(2);
    
    clearChildren(parent);
    expect(parent.children.length).toBe(0);
  });
});
