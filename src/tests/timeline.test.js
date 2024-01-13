import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import { animate, timeline } from '../chnobli.js';
import { el } from '../utils/testdomnode.js';

describe('timeline', () => {
	it('empty timeline', () => {
		const ticker = new TestTicker;

		const tl = timeline();
		tl.play();
		const finished = ticker.run();
		expect(finished).toBe(true);
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

		ticker.run();
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

	it('timeline seeking', () => {
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

		tl.seekMs(10);
		ticker.run();
		expect(target.style.transform).toBe('translateX(10.000px)');

		tl.seekMs(11);
		ticker.run();
		expect(target.style.transform).toBe('translateX(11.000px)');

		tl.seekMs(20);
		ticker.run();
		expect(target.style.transform).toBe('translateX(20.000px)');

		tl.seekMs(8);
		ticker.run();
		expect(target.style.transform).toBe('translateX(8.000px)');
	});

	it('seeking after', () => {
		const ticker = new TestTicker;

		const target = el();
		const ani = animate(target, {
			autoplay: false,
			duration: 10,
			x: 10
		});
		ani.seek(2);

		ticker.run();
		expect(target.style.transform).toBe('translateX(10.000px)');
	});

	it('timeline controls', () => {
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

		tl.seekMs(10);
		ticker.run();
		expect(target.style.transform).toBe('translateX(10.000px)');

		tl.play();
		ticker.run();
		expect(target.style.transform).toBe('translateX(20.000px)');

		tl.reset();
		tl.play();
		ticker.run(10);
		expect(target.style.transform).toBe('translateX(10.000px)');

		tl.reverse();
		ticker.run(5);
		expect(target.style.transform).toBe('translateX(5.000px)');

		tl.reverse();
		ticker.run();
		expect(target.style.transform).toBe('translateX(20.000px)');

		tl.reverse();
		tl.play();
		ticker.run();
		expect(target.style.transform).toBe('');
	});

	it('timeline events', () => {
		const ticker = new TestTicker;

		const target = el();
		const tl = timeline()
			.add(target, {
				x: 50,
				duration: 10
			})
			.add(target, {
				y: 50,
				duration: 10
			});

		let endCounter = 0;
		tl.on('end', () => endCounter += 1);

		tl.play();
		ticker.run(5);
		expect(endCounter).toBe(0);

		ticker.run();
		expect(endCounter).toBe(1);

		tl.play();
		ticker.run();
		// not sure this is the behaviour we wan't
		expect(endCounter).toBe(2);

		tl.reverse();
		ticker.run();
		expect(endCounter).toBe(2);
		expect(target.style.transform).toBe('translateX(50.000px) translateY(50.000px)');

		tl.play();
		ticker.run();
		expect(endCounter).toBe(3);
		expect(target.style.transform).toBe('');

		tl.play();
		ticker.run();
		expect(endCounter).toBe(4);
	});
});