import { Callback } from '../responsive/ResponsiveEvent';
import { curve } from './motionpath';

export { curve };

/**
 * Explicitly tells a property to animate the to value
 */
export function to(to: any) {
	return { to };
}

/**
 * Explicitly tells a property to animate the from value
 */
export function from(from: any) {
	return { from };
}

/**
 * Explicitly tells a property to animate with the from and to values
 */
export function fromTo(from: any, to: any) {
	return { from, to };
}

/**
 * makes a value reactive to `Timeline::update` calls or resizes
 */
export function responsive(fn: (target: any) => void): any {
	return { responsive: fn };
}

/**
 * Converts an element with text into span with chars
 */
export function chars(element: HTMLElement) {
	if (element.dataset.processedChars) return Array.from(element.children);

	const chars = element.textContent!.split('');

	element.textContent = '';
	element.dataset.processedChars = 'yes';

	return chars
		.map(c => {
			if (c.trim().length === 0) {
				element.appendChild(document.createTextNode(c));
				return null;
			}

			const span = document.createElement('span');
			span.textContent = c;
			span.style.display = 'inline-block';
			element.appendChild(span);

			return span;
		})
		.filter(c => !!c);
}

/**
 * Converts an element with text into span with words
 */
export function words(element: HTMLElement) {
	if (element.dataset.processedWords) return Array.from(element.children);

	const words = element.textContent!.split(/(\s+)/);

	element.textContent = '';
	element.dataset.processedWords = 'yes';

	return words
		.map(word => {
			if (word.trim().length === 0) {
				element.appendChild(document.createTextNode(word));
				return null;
			}

			const span = document.createElement('span');
			span.textContent = word;
			span.style.display = 'inline-block';
			element.appendChild(span);

			return span;
		})
		.filter(w => !!w);
}

/**
 * get the offset to the current page page
 */
export function pageOffset(el: HTMLElement) {
	if ('offsetTop' in el) {
		return {
			top: el.offsetTop,
			left: el.offsetLeft,
			width: el.offsetWidth,
			height: el.offsetHeight,
		};
	}

	const rect = (el as HTMLElement).getBoundingClientRect();
	return {
		top: window.scrollY + rect.top,
		left: window.scrollX + rect.left,
		width: rect.width,
		height: rect.height,
	};
}
