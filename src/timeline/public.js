import { takeProp } from '../utils/internal.js';
import Timeline from './timeline.js';
import { STATE_AFTER } from '../timing/timing.js';
import { callStagger } from '../stagger/stagger.js';

export default class PublicTimeline {
	constructor(props = {}) {
		this._defaults = takeProp(props, 'defaults', {});
		this._inner = new Timeline(props);

		this._runningTicker = null;
	}

	set(targets, props, offset = null) {
		// for the moment let's just add as usual but set the duration to 0
		return this.add(targets, { ...props, duration: 0 }, offset);
	}

	add(targets, props, offset = null) {
		if (Array.from(targets).length === 0)
			targets = [targets];
		else
			targets = Array.from(targets);

		let i = -1;
		for (const target of targets) {
			i++;

			const nProps = {
				...this._defaults,
				...props
			};

			console.log('nProps', nProps);

			for (const prop in nProps) {
				nProps[prop] = callStagger(nProps[prop], i, targets.length);
			}

			console.log('nProps', nProps);

			const nOffset = callStagger(offset, i);

			console.log('target', target);

			this._inner.add(target, nProps, nOffset, i);
		}

		// props = {
		// 	...this._defaults,
		// 	...props
		// };

		// now handle stagger

		// this._inner.add(targets, , offset);

		return this;
	}

	label(label, offset = null) {
		this._inner.label(label, offset);

		return this;
	}

	play() {
		if (this._runningTicker)
			return;

		this._inner.init();

		this._runningTicker = this._inner.ticker.add((change, opts) => {
			if (this._inner.timing.state === STATE_AFTER)
				opts.remove();

			this._inner.advance(change);

			this._inner.render();
		});

		return this;
	}

	pause() {
		if (!this._runningTicker)
			return;

		this._runningTicker.remove();
		this._runningTicker = null;
	}

	// 0-1
	seek(pos) {
		this._inner.seek(pos);
	}

	reset() {
		this._inner.seek(0);
	}

	reverse() {
		this._inner.timing.reverse();
	}
}