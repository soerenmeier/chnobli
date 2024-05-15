import PublicTimeline, { Offset } from '../timeline/public.js';
import { pageOffset } from '../utils/utils.js';
import ScrollEvent from './ScrollEvent.js';

/*
run timelines based on the scroll position

scroll allows to specify a start and end trigger
which then makes sure the timeline is always in sync with
the scroll position

{
	start: myDiv,
	// when the top of myDiv is at the top of the viewport
	end: {
		target: myDiv,
		offset: 'bottom',
		view: 'bottom'
	}
	// when the bottom of myDiv is at the bottom of the viewport
}





run animation when in view (start stop resume when different events happen)



specify when trigger starts: start: "top(triggerEl) center(viewport)"
end: bottom top


startTriger

endTrigger


skew on scroll

scroll pin (once in trigger zone, elements keeps it position relative to start of trigger)

parallax
*/

export type ScrollTrigger =
	| {
			target: HTMLElement;
			offset?: OffsetValue;
			view?: OffsetValue;
	  }
	| HTMLElement;

export type OffsetValue = 'top' | 'center' | 'bottom' | number;

export type ParsedScrollTrigger = {
	target: HTMLElement;
	offset: number;
	view: number;
	position: Position;
};

export type ScrollOffset = {
	// the offset in pixels
	y: number;
	// the offset in percentage (0-1)
	view: number;
	// position
	position: number;
};

export type Position = number | string;

export default class ScrollTimeline {
	private _initialized: boolean;
	private _globalEvent: ScrollEvent;
	private _rmEvent: () => void;

	private _triggers: ParsedScrollTrigger[];
	private timelines: PublicTimeline[];
	offsets: ScrollOffset[];

	constructor() {
		this._initialized = false;
		this._globalEvent = ScrollEvent.global();
		this._rmEvent = this._globalEvent.add(y => this._onScroll(y)).remove;

		this._triggers = [];
		this.timelines = [];
		this.offsets = [];

		// this.timeline = timeline;
		// this._triggers = triggers.map(parseTrigger);
		// this.offsets = this._triggers.map(t => {
		// 	return {
		// 		y: 0,
		// 		view: t.view,
		// 	};
		// });

		// if (this.offsets.length < 2)
		// 	throw new Error('scroll timeline needs at least two triggers');
	}

	/**
	 * Add a trigger to the timeline
	 *
	 * Providing an offset at which point the trigger should end
	 *
	 * If it is the first trigger it is not allowed to be set?
	 */
	add(trigger: ScrollTrigger, position?: Position) {
		this._triggers.push(
			parseTrigger(trigger, position, this._triggers.length),
		);
	}

	addTimeline(timeline: PublicTimeline) {
		this.timelines.push(timeline);
	}

	init() {
		// todo we need to calculate the position for each timeline
		//
		// calculate the positions and offsets
		// if we are missing one extend them

		let previousY = -1;

		this.offsets = this._triggers.map(t => {
			const offset = pageOffset(t.target);

			const y = offset.top + offset.height * t.offset;

			if (y < previousY) throw new Error('offsets are not in order');

			let position;
			if (typeof t.position === 'string') {
				if (this.timelines.length !== 1)
					throw new Error(
						'labels can only be used with one timeline',
					);

				position = this.timelines[0].labelPosition(t.position);
			} else if (t.position >= 0 || t.position <= 1) {
				position = t.position;
			} else {
				throw new Error('position should be between 0 and 1');
			}

			return {
				y,
				view: t.view,
				position,
			};
		});

		if (this.offsets.length < 1)
			throw new Error('scroll timeline needs at least one trigger');

		if (this.offsets.length === 1) {
			this.offsets.push({
				y:
					this.offsets[0].y +
					pageOffset(this._triggers[0].target).height,
				view: 1,
				position: 1,
			});
		}
	}

	private _onScroll({ y, height }: { y: number; height: number }) {
		if (!this._initialized) {
			this.init();
			this._initialized = true;
		}

		// find the matching offset
		// rolling window
		for (let i = 1; i < this.offsets.length; i++) {
			const start = this.offsets[i - 1];
			const end = this.offsets[i];

			const startY = start.y + height * start.view;
			const endY = end.y + height * end.view;

			const dif = endY - startY;
			const x = 1 - (endY - y) / dif;

			for (const timeline of this.timelines) {
				// calc pos range
				const pos =
					start.position + (end.position - start.position) * x;

				timeline.seek(pos);
			}
		}
	}
}

/**
 * Parse the start property
 *
 * can be an HTMLElement or an object { target, offset }
 *
 * the default offset is top
 * the default view is top
 */
function parseTrigger(
	val: ScrollTrigger,
	position: Position | undefined,
	i: number,
): ParsedScrollTrigger {
	// might be an object { target, offset }
	if (!val) {
		throw new Error('unknown property use an html element or an object');
	}

	let element = null;
	let offset: OffsetValue = 'top';
	let view: OffsetValue = i == 0 ? 'top' : 'bottom';

	if (typeof val === 'object') {
		if (val instanceof HTMLElement) {
			element = val;
		} else if ('target' in val) {
			element = val.target;
			if (typeof val.offset !== 'undefined') offset = val.offset;
			if (typeof val.view !== 'undefined') view = val.view;
		} else {
			throw new Error('start unknown ' + val);
		}
	} else {
		throw new Error('unknown start val');
	}

	return {
		target: element,
		offset: parseOffset(offset),
		view: parseOffset(view),
		position: position ?? (i == 0 ? 0 : 1),
	};
}

/**
 * Parse the offset value
 *
 * can be a string (top, center, bottom) or a number (0-1)
 *
 * 0 = top
 * 0.5 = center
 * 1 = bottom
 */
function parseOffset(val: OffsetValue): number {
	if (typeof val === 'string') {
		if (val === 'top') return 0;
		if (val === 'center') return 0.5;
		if (val === 'bottom') return 1;

		throw new Error('unknown view value ' + val);
	}

	if (typeof val !== 'number' || val < 0 || val > 1) {
		throw new Error(
			'view expecting to be a top/center/bottom or a percent value',
		);
	}

	return val;
}
