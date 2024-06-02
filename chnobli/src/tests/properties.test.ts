import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/TestTicker.js';
import TestResponsiveEvent from '../responsive/TestEvent.js';
import { animate, timeline } from '../chnobli.js';
import { responsive, curve, fromTo } from '../utils/utils.js';
import { el } from '../target/TestDomNode.js';
import { timeout } from 'fire/utils';

describe('properties', () => {
	it('resetprops', () => {
		const ticker = new TestTicker();

		const div = el();
		const tl = timeline()
			.add(div, {
				x: 100,
				width: 100,
				duration: 10,
			})
			.play();

		ticker.run();
		expect(div.style.transform).toBe(
			'translate3d(100.000px,0.000px,0.000px)',
		);
		expect(div.style.width).toBe('100.000px');

		tl.resetProps();
		expect(div.style.transform).toBe('');
		expect(div.style.width).toBe(undefined);
	});

	it('destroy', async () => {
		const ticker = new TestTicker();

		function runDestroyTest(cleanup: any, ticker: any) {
			const div = el();
			cleanup.register(div, 'div');
			expect(ticker.targets.size()).toBe(0);
			const tl = timeline()
				.add(div, {
					x: 100,
					width: 100,
					duration: 10,
				})
				.play();

			expect(ticker.targets.size()).toBe(1);

			ticker.run();
			expect(div.style.transform).toBe(
				'translate3d(100.000px,0.000px,0.000px)',
			);
			expect(div.style.width).toBe('100.000px');

			tl.destroy();
			expect(div.style.transform).toBe('');
			expect(div.style.width).toBe(undefined);
			expect(ticker.targets.size()).toBe(0);
		}

		let resolveCleanupProm: any;
		let cleanupProm = new Promise(
			resolve => (resolveCleanupProm = resolve),
		);
		const cleanup = new FinalizationRegistry(key => {
			resolveCleanupProm(key);
		});

		runDestroyTest(cleanup, ticker);

		// @ts-ignore
		global.gc();

		const res = await Promise.race([
			cleanupProm,
			timeout(2000).then(() => 'timedout'),
		]);
		expect(res).toBe('div');
	});

	it('update timeline', () => {
		const ticker = new TestTicker();
		const respEv = new TestResponsiveEvent();

		const div = el();
		div.computedStyle.width = '10px';

		const tl = timeline().add(div, {
			width: 100,
			duration: 10,
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

		tl.reverse();
		tl.play();
		ticker.run(5);
		expect(div.style.width).toBe('60.000px');

		div.computedStyle.width = '30px';
		respEv.resize(100, 200);
		expect(div.style.width).toBe('65.000px');
	});

	it('responsive', () => {
		const ticker = new TestTicker();
		const respEv = new TestResponsiveEvent();

		const div = el();
		div.computedStyle.width = '10px';

		let windowWidth = 16;

		let windowAspectRatio: any;
		const resp1 = responsive(() => {
			windowAspectRatio = windowWidth / 9;
		});

		const tl = timeline()
			.add(div, {
				width: responsive(() => 20 * windowAspectRatio),
				duration: 10,
			})
			.addResponsive(resp1);

		expect(windowAspectRatio).toBe(undefined);

		tl.play();
		ticker.run();
		expect(div.style.width).toBe('35.556px');

		windowWidth = 15;
		respEv.resize(100, 200);
		expect(div.style.width).toBe('33.333px');
	});

	it('xy', () => {
		const ticker = new TestTicker();

		const div = el();
		const tl = timeline().add(div, {
			xy: curve([
				{ x: 0, y: 10 },
				{ x: 100, y: 10 },
				{ x: 50, y: 20 },
			]),
			duration: 10,
		});

		tl.play();
		ticker.run(0);
		expect(div.style.transform).toBe(
			'translate3d(0.000px,10.000px,0.000px)',
		);

		ticker.run(5);
		expect(div.style.transform).toBe(
			'translate3d(100.000px,10.000px,0.000px)',
		);

		ticker.run();
		expect(div.style.transform).toBe(
			'translate3d(50.000px,20.000px,0.000px)',
		);
	});

	it('object-target', () => {
		const ticker = new TestTicker();

		const obj: { x: number; width?: number } = {
			x: 0,
		};
		const tl = timeline()
			.add(obj, {
				x: 100,
				width: fromTo(0, 100),
				duration: 10,
			})
			.play();

		ticker.run(5);
		expect(obj.x).toBe(50);
		expect(obj.width).toBe(50);

		ticker.run();
		expect(obj.x).toBe(100);
		expect(obj.width).toBe(100);

		tl.reverse();
		tl.play();
		ticker.run();
		expect(obj.x).toBe(0);
		expect(obj.width).toBe(undefined);
	});

	it('reset values', () => {
		const ticker = new TestTicker();

		const div = el();
		div.computedStyle.width = '0px';
		const tl = timeline()
			.add(div, {
				width: 100,
				duration: 10,
			})
			.play();

		ticker.run();
		expect(div.style.width).toBe('100.000px');

		tl.reverse();
		tl.play();
		ticker.run();
		expect(div.style.width).toBe(undefined);
	});
});
