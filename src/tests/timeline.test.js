import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import { timeline } from '../chnobli.js';
import { el } from '../utils/testdomnode.js';

describe('timeline', () => {
	it('empty timeline', () => {
		const ticker = new TestTicker;

		const tl = timeline();

		tl.play();

		const ran = ticker.run(10, 1);
		expect(ran).toBe(1);
	});

	it('single timeline', () => {
		const ticker = new TestTicker;

		const tl = timeline();
		const target = el();
		tl.add(target, {
			x: 10,
			duration: 10
		});
		tl.play();

		console.log(target);

		ticker.run(0);
		expect(target.style.transform).toBe('translateX(0.000px)');

		const ran = ticker.run();
		expect(ran).toBe(10);

		expect(target.style.transform).toBe('translateX(10.000px)');
	});

	it('offsetTimeline timeline', () => {
		const ticker = new TestTicker;

		const tl = timeline();
		const target = el();
		tl.add(target, {
			x: 10,
			duration: 10
		});
		tl.add(target, {
			x: 20,
			duration: 10
		})
		tl.play();

		ticker.run(10);
		expect(target.style.transform).toBe('translateX(10.000px)');
		ticker.run(1);
		expect(target.style.transform).toBe('translateX(11.000px)');

		ticker.run();
		expect(target.style.transform).toBe('translateX(20.000px)');
	});

	// it('timeline seeking', () => {
	// 	const ticker = new TestTicker;

	// 	const tl = timeline();
	// 	const target = el();
	// 	tl.add(target, {
	// 		x: 10,
	// 		duration: 10
	// 	});
	// 	tl.add(target, {
	// 		x: 20,
	// 		duration: 10
	// 	})
	// 	tl.seek(2);

	// 	ticker.run();
	// 	expect(target.style.transform).toBe('translateX(10.000px)');
	// });
});