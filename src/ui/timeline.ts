import { createElement, clearChildren } from './dom-utils';

export interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

const DEFAULT_TIMELINE: TimelinePhase[] = [
  {
    id: 'phase-1',
    title: '1. Voter Registration',
    description: 'Ensure you are registered to vote before the deadline. Deadlines vary by state.',
    isActive: true,
  },
  {
    id: 'phase-2',
    title: '2. Primary Elections',
    description: 'Voters choose their party\'s candidate for the general election.',
    isActive: false,
  },
  {
    id: 'phase-3',
    title: '3. Campaigning & Debates',
    description: 'Candidates campaign and participate in debates to discuss their platforms and secure votes.',
    isActive: false,
  },
  {
    id: 'phase-4',
    title: '4. General Election Day',
    description: 'Citizens cast their votes. This usually happens in early November for federal US elections.',
    isActive: false,
  },
  {
    id: 'phase-5',
    title: '5. Results & Certification',
    description: 'Votes are counted and results are officially certified.',
    isActive: false,
  }
];

export function renderTimeline(containerId: string, phases: TimelinePhase[] = DEFAULT_TIMELINE): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  clearChildren(container);

  phases.forEach((phase) => {
    // Create Timeline Node
    const nodeClass = phase.isActive ? 'timeline-node active' : 'timeline-node';
    const nodeEl = createElement('div', {
      classes: nodeClass.split(' '),
      attributes: { 'aria-hidden': 'true' }
    });

    // Outer Wrapper
    const contentWrapperClass = phase.isActive ? 'timeline-content glow' : 'timeline-content';
    const titleEl = createElement('h3', { textContent: phase.title });
    const descEl = createElement('p', { textContent: phase.description });

    const contentEl = createElement('div', {
      classes: contentWrapperClass.split(' '),
      children: [titleEl, descEl]
    });

    // Item container
    const itemEl = createElement('div', {
      classes: ['timeline-item'],
      attributes: { 
        'role': 'listitem',
        'aria-current': phase.isActive ? 'step' : 'false'
      },
      children: [nodeEl, contentEl]
    });
    
    // Add click handler to toggle activation visually (interactive experience)
    itemEl.addEventListener('click', () => {
      // Basic interactivity: mark this phase as active (just visually for demonstration)
      const allItems = container.querySelectorAll('.timeline-item');
      allItems.forEach(el => {
        el.querySelector('.timeline-node')?.classList.remove('active');
        el.querySelector('.timeline-content')?.classList.remove('glow');
        el.setAttribute('aria-current', 'false');
      });

      nodeEl.classList.add('active');
      contentEl.classList.add('glow');
      itemEl.setAttribute('aria-current', 'step');
    });

    container.appendChild(itemEl);
  });
}
