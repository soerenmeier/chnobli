import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import TestResponsiveEvent from '../responsive/testevent.js';
import { animate, timeline } from '../chnobli.js';
import { responsive } from '../utils/utils.js';
import { el } from '../utils/testdomnode.js';

describe('usecases', () => {
	it('accordion', () => {
		const ticker = new TestTicker;
		const respEv = new TestResponsiveEvent;

		const itm = el();
		const ctn = el();
		ctn.computedStyle.maxHeight = 'none';
		ctn.scrollHeight = '100px';

		const tl = timeline()
			.set(itm, {
				cls: 'open'
			})
			.add(ctn, {
				maxHeight: responsive(el => el.scrollHeight),
				duration: 100
			}, 0);

		// // on click
		tl.play();
		ticker.run(5);
		expect(ctn.style.maxHeight).toBe('5.000px');
		expect(itm.classList.contains('open')).toBe(true);

		ticker.run();
		expect(ctn.style.maxHeight).toBe('100.000px');
		expect(itm.classList.contains('open')).toBe(true);

		// now a resize comes
		ctn.scrollHeight = '200px';
		tl.update();
		expect(ctn.style.maxHeight).toBe('200.000px');
		expect(itm.classList.contains('open')).toBe(true);

		// on click
		tl.reverse();
		tl.play();
		ticker.run(12);
		expect(ctn.style.maxHeight).toBe('176.000px');
		expect(itm.classList.contains('open')).toBe(true);

		ctn.scrollHeight = '150px';
		respEv.resize(1000, 1000);
		expect(ctn.style.maxHeight).toBe('132.000px');
		expect(itm.classList.contains('open')).toBe(true);

		ticker.run();
		expect(ctn.style.maxHeight).toBe(undefined);
		expect(itm.classList.contains('open')).toBe(false);
	});
});