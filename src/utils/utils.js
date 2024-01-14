import { curve } from './motionpath.js';

export { curve };

/**
 * Explicitly tells a property to animate the to value
 */
export function to(to) {
	return { to };
}

/**
 * Explicitly tells a property to animate the from value
 */
export function from(from) {
	return { from };
}

/**
 * Explicitly tells a property to animate with the from and to values
 */
export function fromTo(from, to) {
	return { from, to };
}

/**
 * makes a value reactive to `Timeline::update` calls or resizes
 */
export function responsive(fn) {
	return { responsive: fn };
}

/**
 * Converts an element with text into span with chars
 */
export function chars(element) {
	if (element.dataset.processedChars)
		return Array.from(element.children);

	const chars = element.textContent.split('');

	element.textContent = '';
	element.dataset.processedChars = 'yes';

	return chars.map(c => {
		const span = document.createElement('span');
		span.textContent = c;
		span.style.display = 'inline-block';
		element.appendChild(span);

		return span;
	});
}

/**
 * get the offset to the current page page
 */
export function pageOffset(el) {
	if ('offsetTop' in el) {
		return {
			top: el.offsetTop,
			left: el.offsetLeft,
			width: el.offsetWidth,
			height: el.offsetHeight
		};
	}

	const rect = el.getBoundingClientRect();
	return {
		top: window.scrollY + rect.top,
		left: window.scrollX + rect.left,
		width: rect.width,
		height: rect.height
	};
}