import { renderTimeline } from '../src/ui/timeline';

describe('Timeline UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="timeline-container"></div>';
  });

  it('should render the default timeline', () => {
    renderTimeline('timeline-container');
    const container = document.getElementById('timeline-container');
    expect(container).not.toBeNull();
    const items = container?.querySelectorAll('.timeline-item');
    expect(items?.length).toBe(5); // Default phases

    // First phase should be active
    const firstNode = items?.[0].querySelector('.timeline-node');
    expect(firstNode?.classList.contains('active')).toBe(true);
  });

  it('should handle custom phases', () => {
    const customPhases = [
      { id: '1', title: 'Test 1', description: 'Desc 1', isActive: false },
      { id: '2', title: 'Test 2', description: 'Desc 2', isActive: true },
    ];
    renderTimeline('timeline-container', customPhases);

    const container = document.getElementById('timeline-container');
    const items = container?.querySelectorAll('.timeline-item');
    expect(items?.length).toBe(2);

    const secondNode = items?.[1].querySelector('.timeline-node');
    expect(secondNode?.classList.contains('active')).toBe(true);
  });

  it('should interact and toggle active phase on click', () => {
    renderTimeline('timeline-container');
    const container = document.getElementById('timeline-container');
    const items = container?.querySelectorAll('.timeline-item');

    // Click second item
    const secondItem = items?.[1] as HTMLElement;
    secondItem.click();

    const secondNode = secondItem.querySelector('.timeline-node');
    expect(secondNode?.classList.contains('active')).toBe(true);
    expect(secondItem.getAttribute('aria-current')).toBe('step');

    // First item should no longer be active
    const firstItem = items?.[0];
    const firstNode = firstItem?.querySelector('.timeline-node');
    expect(firstNode?.classList.contains('active')).toBe(false);
  });

  it('should do nothing if container not found', () => {
    renderTimeline('invalid-container');
    // Just asserting it doesn't throw
    expect(true).toBe(true);
  });
});
