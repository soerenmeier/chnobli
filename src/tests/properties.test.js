import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import { animate, timeline } from '../chnobli.js';
import { el } from '../utils/testdomnode.js';

describe('usecases', () => {
	it('resetprops', () => {
		const ticker = new TestTicker;

		const div = el();
		const tl = timeline()
			.add(div, {
				x: 100,
				width: 100,
				duration: 10
			})
			.play();

		ticker.run();
		console.log(div);
		expect(div.style.transform).toBe('translateX(100.000px)');
		expect(div.style.width).toBe('100.000px');

		tl.resetProps();
		expect(div.style.transform).toBe('');
		expect(div.style.width).toBe(undefined);
	});
});