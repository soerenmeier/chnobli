import { curve } from './motionpath.js';

export { curve };

export function to(to) {
	return { to };
}

export function from(from) {
	return { from };
}

export function fromTo(from, to) {
	return { from, to };
}

// converts some element 
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

// get the offset to the page
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