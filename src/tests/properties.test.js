import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import { animate, timeline } from '../chnobli.js';
import { el } from '../utils/testdomnode.js';

describe('properties', () => {
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
		expect(div.style.transform).toBe('translateX(100.000px)');
		expect(div.style.width).toBe('100.000px');

		tl.resetProps();
		expect(div.style.transform).toBe('');
		expect(div.style.width).toBe(undefined);
	});

	it('update timeline', () => {
		const ticker = new TestTicker;

		const div = el();
		div.computedStyle.width = '10px';

		const tl = timeline()
			.add(div, {
				width: 100,
				duration: 10
			});

		tl.seek(0);
		ticker.run();
		expect(div.style.width).toBe('10.000px');

		tl.play();
		ticker.run(1);
		expect(div.style.width).toBe('19.000px');

		// on resize the div changes it's size
		div.computedStyle.width = '20px';
		tl.update();
		expect(div.style.width).toBe('28.000px');

		ticker.run(1);
		expect(div.style.width).toBe('36.000px');
		ticker.run();
		expect(div.style.width).toBe('100.000px');
	});
});