import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import { animate, timeline } from '../chnobli.js';
import { reactive } from '../utils/utils.js';
import { el } from '../utils/testdomnode.js';

describe('usecases', () => {
	it('accordion', () => {
		const ticker = new TestTicker;

		const itm = el();
		const ctn = el();
		ctn.computedStyle.maxHeight = 'none';
		ctn.scrollHeight = '100px';

		const tl = timeline()
			.add(itm, {
				// clsAdd: 'open',
				duration: 100
			})
			.add(ctn, {
				maxHeight: reactive(el => el.scrollHeight),
				duration: 100
			}, 0);

		// // on click
		tl.play();
		ticker.run(1);
		expect(ctn.style.maxHeight).toBe('1.000px');

		ticker.run();
		expect(ctn.style.maxHeight).toBe('100.000px');

		// now a resize comes
		ctn.scrollHeight = '200px';
		tl.update();
		expect(ctn.style.maxHeight).toBe('200.000px');
	});
});