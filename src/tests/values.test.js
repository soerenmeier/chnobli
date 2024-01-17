import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/testticker.js';
import TestResponsiveEvent from '../responsive/testevent.js';
import { animate, timeline } from '../chnobli.js';
import { responsive, from, fromTo } from '../utils/utils.js';
import { el, getRootElement } from '../target/testdomnode.js';
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
		expect(div.style.transform).toBe('translate3d(0.000%,0.000px,0.000px)');
		expect(div.style.width).toBe('100.000%');

		ticker.run();
		expect(div.style.transform).toBe('translate3d(10.000%,0.000px,0.000px)');
		expect(div.style.width).toBe('50.000%');
	});

	it('multiple values', () => {
		const ticker = new TestTicker;

		const root = getRootElement();
		root.computedStyle.fontSize = '10px';

		const div = el();
		div.computedStyle.padding = '5px';
		const tl = timeline()
			.add(div, {
				padding: '10px 20rem',
				duration: 10
			})
			.play();

		ticker.run(0);
		expect(div.style.padding).toBe('5.000px 0.500rem');

		ticker.run();
		expect(div.style.padding).toBe('10.000px 20.000rem');
	});

	it('display', () => {
		const ticker = new TestTicker;

		const div = el();
		div.computedStyle.display = 'block';
		const tl = timeline()
			.add(div, {
				display: 'none',
				position: from('absolute'),
				visibility: fromTo('hidden', 'visible'),
				duration: 10
			})
			.play();

		ticker.run(0);
		expect(div.style.display).toBe(undefined);
		expect(div.style.position).toBe('absolute');
		expect(div.style.visibility).toBe('hidden');

		ticker.run();
		expect(div.style.display).toBe('none');
		expect(div.style.position).toBe(undefined);
		expect(div.style.visibility).toBe('visible');

		tl.seek(-1);
		ticker.run();
		expect(div.style.display).toBe(undefined);
		expect(div.style.position).toBe(undefined);
		expect(div.style.visibility).toBe(undefined);
	});
});