import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import TestResponsiveEvent from '../responsive/testevent.js';
import { animate, timeline } from '../chnobli.js';
import { responsive } from '../utils/utils.js';
import { el } from '../utils/testdomnode.js';
import { timeout } from 'fire/util.js';

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

	it('destroy', async () => {
		const ticker = new TestTicker;

		function runDestroyTest(cleanup, ticker) {

			const div = el();
			cleanup.register(div, 'div');
			expect(ticker.targets.size()).toBe(0);
			const tl = timeline()
				.add(div, {
					x: 100,
					width: 100,
					duration: 10
				})
				.play();

			expect(ticker.targets.size()).toBe(1);

			ticker.run();
			expect(div.style.transform).toBe('translateX(100.000px)');
			expect(div.style.width).toBe('100.000px');

			tl.destroy();
			expect(div.style.transform).toBe('');
			expect(div.style.width).toBe(undefined);
			expect(ticker.targets.size()).toBe(0);
		}

		let resolveCleanupProm;
		let cleanupProm = new Promise(resolve => resolveCleanupProm = resolve);
		const cleanup = new FinalizationRegistry(key => {
			resolveCleanupProm(key);
		});

		runDestroyTest(cleanup, ticker);

		global.gc();

		const res = await Promise.race([
			cleanupProm,
			timeout(2000).then(() => 'timedout')
		]);
		expect(res).toBe('div');
	});

	it('update timeline', () => {
		const ticker = new TestTicker;
		const respEv = new TestResponsiveEvent;

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

		tl.reverse();
		tl.play();
		ticker.run(5);
		expect(div.style.width).toBe('60.000px');

		div.computedStyle.width = '30px';
		respEv.resize();
		expect(div.style.width).toBe('65.000px');
	});

	it('responsive', () => {
		const ticker = new TestTicker;
		const respEv = new TestResponsiveEvent;

		const div = el();
		div.computedStyle.width = '10px';

		let windowWidth = 16;

		let windowAspectRatio;
		const resp1 = responsive(() => {
			console.log('reso call');
			windowAspectRatio = windowWidth / 9;
		});

		const tl = timeline()
			.add(div, {
				width: responsive(e => {
					console.log('width resp');
					return 20 * windowAspectRatio
				}),
				duration: 10
			})
			.addResponsive(resp1);

		expect(windowAspectRatio).toBe(undefined);

		tl.play();
		ticker.run();
		expect(div.style.width).toBe('35.556px');

		windowWidth = 15;
		respEv.resize();
		expect(div.style.width).toBe('33.333px');
	});
});