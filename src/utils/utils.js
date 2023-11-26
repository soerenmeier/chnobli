

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
	if (element.dataset.processedByChars)
		return Array.from(element.children);

	const chars = element.textContent.split('');

	element.textContent = '';
	element.dataset.processedByChars = true;

	return chars.map(c => {
		const span = document.createElement('span');
		span.textContent = c;
		span.style.display = 'inline-block';
		element.appendChild(span);

		return span;
	});
}