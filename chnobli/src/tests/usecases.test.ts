import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/TestTicker.js';
import TestResponsiveEvent from '../responsive/TestEvent.js';
import { timeline } from '../chnobli.js';
import { fromTo, responsive } from '../utils/utils.js';
import { el } from '../target/TestDomNode.js';

describe('usecases', () => {
	it('accordion', () => {
		const ticker = new TestTicker();
		const respEv = new TestResponsiveEvent();

		const itm = el();
		const ctn = el();
		ctn.computedStyle.maxHeight = 'none';
		// @ts-ignore
		ctn.scrollHeight = '100px';

		const tl = timeline()
			.set(itm, {
				cls: 'open',
			})
			.add(ctn, {
				maxHeight: responsive(el => el.scrollHeight),
				duration: 100,
			});

		tl.play();
		ticker.run(1);
		expect(ctn.style.maxHeight).toBe('1.000px');
		expect(itm.classList.contains('open')).toBe(true);

		// // on click
		tl.play();
		ticker.run(4);
		expect(ctn.style.maxHeight).toBe('5.000px');
		expect(itm.classList.contains('open')).toBe(true);

		ticker.run();
		expect(ctn.style.maxHeight).toBe('100.000px');
		expect(itm.classList.contains('open')).toBe(true);

		// now a resize comes
		// @ts-ignore
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

		// @ts-ignore
		ctn.scrollHeight = '150px';
		respEv.resize(1000, 1000);
		expect(ctn.style.maxHeight).toBe('132.000px');
		expect(itm.classList.contains('open')).toBe(true);

		ticker.run();
		expect(ctn.style.maxHeight).toBe(undefined);
		expect(itm.classList.contains('open')).toBe(false);
	});

	it('accordion2', () => {
		const ticker = new TestTicker();
		const _respEv = new TestResponsiveEvent();

		const ctn = el();
		ctn.computedStyle.maxHeight = 'none';
		// @ts-ignore
		ctn.scrollHeight = '100px';

		const tl = timeline({ reversed: true }).add(ctn, {
			height: fromTo(
				0,
				responsive(el => el.scrollHeight),
			),
			duration: 100,
		});

		const toggle = () => {
			tl.reverse();
			tl.play();
		};

		// on click reverse or not
		toggle();
		ticker.run(1);
		expect(ctn.style.height).toBe('1.000px');
		ticker.run(49);
		expect(ctn.style.height).toBe('50.000px');
		toggle();
		ticker.run(1);
		expect(ctn.style.height).toBe('49.000px');
		ticker.run(29);
		expect(ctn.style.height).toBe('20.000px');
		toggle();
		ticker.run(1);
		expect(ctn.style.height).toBe('21.000px');
	});
});
