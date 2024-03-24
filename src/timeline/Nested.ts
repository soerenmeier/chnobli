import { takeProp } from '../utils/internal';
import Timeline from './TimeLine';
import { timelineAdd } from './public';

export default class NestedTimeline {
	_defaults: Record<string, any>;
	_inner: Timeline;

	constructor(props: Record<string, any> = {}) {
		this._defaults = takeProp(props, 'defaults', {});

		if ('duration' in props)
			throw new Error('a timeline does not accept a duration');

		this._inner = new Timeline(props);
	}

	/**
	 * Set's properties
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	set(targets: any, props: Record<string, any>, offset: any = null) {
		// for the moment let's just add as usual but set the duration to 0
		return this.add(targets, { ...props, duration: 0 }, offset);
	}

	/**
	 * Add an animation to the timeline
	 *
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	add(targets: any, props: Record<string, any>, offset: any = null) {
		timelineAdd(this, targets, props, offset);

		return this;
	}

	/**
	 * Adds a label at to the current nOffse
	 *
	 * This label can then be used in offsets
	 */
	label(label: string, offset: any = null) {
		this._inner.label(label, offset);

		return this;
	}

	/**
	 * Allows to nest timelines
	 *
	 * fn: (timeline)
	 */
	nest(
		fn: (tl: NestedTimeline) => void,
		opts: Record<string, any> = {},
		offset: any = null,
	) {
		const tl = new NestedTimeline(opts);

		fn(tl);

		this._inner.addTimeline(tl._inner, offset);

		return this;
	}
}
