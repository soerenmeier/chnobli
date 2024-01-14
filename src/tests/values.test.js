import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import TestResponsiveEvent from '../responsive/testevent.js';
import { animate, timeline } from '../chnobli.js';
import { responsive } from '../utils/utils.js';
import { el, getRootElement } from '../utils/testdomnode.js';
import { timeout } from 'fire/util.js';

describe('values', () => {
	it('rem unit', () => {
		const ticker = new TestTicker;

		const root = getRootElement();
		root.computedStyle.fontSize = '13px';

		const div = el();
		const tl = timeline()
			.add(div, {
				width: '10rem',
				duration: 5
			})
			.add(div, {
				width: 20,
				duration: 5
			})
			.play();

		ticker.run(0);
		expect(div.style.width).toBe('0.000rem');

		ticker.run();
		expect(div.style.width).toBe('20.000rem');
	});

	it('percent unit', () => {
		const ticker = new TestTicker;

		const div = el();
		div.computedStyle.width = '10px';
		const tl = timeline()
			.add(div, {
				x: '10%',
				width: '50%',
				duration: 10
			})
			.play();

		ticker.run(0);
		expect(div.style.transform).toBe('translateX(0.000%)');
		expect(div.style.width).toBe('100.000%');

		ticker.run();
		expect(div.style.transform).toBe('translateX(10.000%)');
		expect(div.style.width).toBe('50.000%');
	});
});