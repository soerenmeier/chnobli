import { describe, expect, it } from 'vitest';
import TestTicker from '../timing/TestTicker';
import { animate, timeline } from '../chnobli';
import { responsive, from, fromTo } from '../utils/utils';
import { el, getRootElement } from '../target/TestDomNode';

describe('values', () => {
	it('rem unit', () => {
		const ticker = new TestTicker();

		const root = getRootElement();
		root.computedStyle.fontSize = '13px';

		const div = el();
		const tl = timeline()
			.add(div, {
				width: '10rem',
				duration: 5,
			})
			.add(div, {
				width: 20,
				duration: 5,
			})
			.play();

		ticker.run(0);
		expect(div.style.width).toBe('0.000rem');

		ticker.run();
		expect(div.style.width).toBe('20.000rem');
	});

	it('percent unit', () => {
		const ticker = new TestTicker();

		const div = el();
		div.computedStyle.width = '10px';
		const tl = timeline()
			.add(div, {
				x: '10%',
				width: '50%',
				duration: 10,
			})
			.play();

		ticker.run(0);
		expect(div.style.transform).toBe('translate3d(0.000%,0.000px,0.000px)');
		expect(div.style.width).toBe('100.000%');

		ticker.run();
		expect(div.style.transform).toBe(
			'translate3d(10.000%,0.000px,0.000px)',
		);
		expect(div.style.width).toBe('50.000%');
	});

	it('multiple values', () => {
		const ticker = new TestTicker();

		const root = getRootElement();
		root.computedStyle.fontSize = '10px';

		const div = el();
		div.computedStyle.padding = '5px';
		const tl = timeline()
			.add(div, {
				padding: '10px 20rem',
				duration: 10,
			})
			.play();

		ticker.run(0);
		expect(div.style.padding).toBe('5.000px 0.500rem');

		ticker.run();
		expect(div.style.padding).toBe('10.000px 20.000rem');
	});

	it('display', () => {
		const ticker = new TestTicker();

		const div = el();
		div.computedStyle.display = 'block';
		const tl = timeline()
			.add(div, {
				display: 'none',
				position: from('absolute'),
				visibility: fromTo('hidden', 'visible'),
				duration: 10,
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

	it('colors', () => {
		const ticker = new TestTicker();
		const div = el();
		div.computedStyle.color = 'rgb(120, 130, 20)';

		const tl = timeline()
			.add(div, {
				color: 'black',
				backgroundColor: 'hsl(10, 80%, 40%)',
				duration: 10,
			})
			.play();

		ticker.run(0);
		expect(div.style.color).toBe('rgba(120, 130, 20, 1.000)');
		expect(div.style.backgroundColor).toBe('rgba(255, 255, 255, 1.000)');

		ticker.run(5);
		expect(div.style.color).toBe('rgba(60, 65, 10, 1.000)');
		expect(div.style.backgroundColor).toBe('rgba(220, 152, 138, 1.000)');

		ticker.run();
		expect(div.style.color).toBe('rgba(0, 0, 0, 1.000)');
		expect(div.style.backgroundColor).toBe('rgba(184, 48, 20, 1.000)');
	});

	it('css-vars', () => {
		const ticker = new TestTicker();
		const div = el();
		div.computedStyle['--color'] = 'rgb(120, 130, 20)';
		div.computedStyle['--border'] = '20px';

		const tl = timeline()
			.add(div, {
				'--color': 'black',
				'--border': '1px 20px',
				duration: 10,
			})
			.play();

		ticker.run(0);
		expect(div.style['--color']).toBe('rgba(120, 130, 20, 1.000)');
		expect(div.style['--border']).toBe('20.000px 20.000px');

		ticker.run(5);
		expect(div.style['--color']).toBe('rgba(60, 65, 10, 1.000)');
		expect(div.style['--border']).toBe('10.500px 20.000px');

		ticker.run();
		expect(div.style['--color']).toBe('rgba(0, 0, 0, 1.000)');
		expect(div.style['--border']).toBe('1.000px 20.000px');
	});
});
