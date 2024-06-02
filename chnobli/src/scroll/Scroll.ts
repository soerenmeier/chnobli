import ResponsiveEvent from '../responsive/ResponsiveEvent.js';
import PublicTimeline from '../timeline/public.js';
import Events from '../utils/Events.js';
import { pageOffset } from '../utils/utils.js';
import ScrollEvent from './ScrollEvent.js';

export type DestroyOptions = {
	/// defaults to true
	timelines?: boolean;
};

const DEF_DESTROY_OPTS: DestroyOptions = {
	timelines: true,
};

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

export type State = 'before' | 'in' | 'after';

export type ParsedScrollTrigger = {
	target: HTMLElement;
	offset: number;
	view: number;
	position: Position | undefined;
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

type LastSeek = {
	pos: number;
	state: State;
};

export default class ScrollTimeline {
	private _initialized: boolean;
	private _globalEvent: ScrollEvent | null;
	private _scrollEvent: () => void;
	private _responsiveEvent: any;

	private _triggers: ParsedScrollTrigger[];
	private _events: Events;
	private lastEvPos: number;
	private timelines: PublicTimeline[];
	private state: State;
	private lastSeek: LastSeek | undefined;
	offsets: ScrollOffset[];

	private debugMarkers: HTMLElement[];
	private debugPrefix?: string;

	constructor() {
		this._initialized = false;
		this._globalEvent = ScrollEvent.global();
		this._scrollEvent =
			this._globalEvent?.add(y => this._onScroll(y)).remove ?? (() => {});
		this._responsiveEvent = ResponsiveEvent.global()?.add((a, b) => {
			this._onResponsive(a, b);
		});

		this._triggers = [];
		this._events = new Events();
		this.lastEvPos = NaN;
		this.timelines = [];
		this.state = 'in';
		this.offsets = [];

		this.debugMarkers = [];
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

	on(event: string, fn: (...args: any[]) => void): () => void {
		return this._events.add(event, fn);
	}

	/// Returns true if the init function was executed
	init(): boolean {
		if (this._initialized) return false;

		this._initialized = true;

		// todo we need to calculate the position for each timeline
		//
		// calculate the positions and offsets
		// if we are missing one extend them

		if (this._triggers.length < 1)
			throw new Error('scroll timeline needs at least one trigger');

		if (this._triggers.length === 1) {
			this._triggers.push({
				target: this._triggers[0].target,
				offset: 1,
				view: 1,
				position: 1,
			});
		}

		const positionStep = 1 / (this._triggers.length - 1);

		// first calculate position and view
		let prevPos = 0;
		this.offsets = this._triggers.map((t, i) => {
			let position;
			if (typeof t.position === 'string') {
				if (this.timelines.length !== 1)
					throw new Error(
						'labels can only be used with one timeline',
					);

				position = this.timelines[0].labelPosition(t.position);
			} else if (typeof t.position === 'number') {
				position = t.position;
			} else {
				position = i * positionStep;
			}

			if (position < prevPos)
				throw new Error('positions are not in order');
			prevPos = position;

			return {
				y: 0,
				view: t.view,
				position,
			};
		});

		this.initY();

		return true;
	}

	private initY() {
		let previousY = -1;
		this.offsets.forEach((offset, i) => {
			const t = this._triggers[i];

			const pOffset = pageOffset(t.target);
			const y = pOffset.top + pOffset.height * t.offset;

			if (y < previousY) throw new Error('offsets are not in order');
			previousY = y;

			offset.y = y;
		});
	}

	update() {
		// execute initY to check if elements have moved
		if (!this.init()) this.initY();

		// todo this position should come from the GlobalEvent
		this._onScroll({
			y: window.scrollY,
			height: window.innerHeight,
		});
	}

	destroy(opts: DestroyOptions = {}) {
		opts = { ...DEF_DESTROY_OPTS, ...opts };

		this._scrollEvent();
		this._events.destroy();
		this._responsiveEvent?.remove();

		if (opts.timelines) {
			for (const timeline of this.timelines) {
				timeline.destroy();
			}
		}

		for (const marker of this.debugMarkers) {
			marker.remove();
		}
		this.debugMarkers = [];
	}

	debug(prefix?: string) {
		this.init();

		this.debugPrefix = prefix;

		const height = window.innerHeight;

		this.offsets.forEach((offset, i) => {
			const y = offset.y - height * offset.view;

			const marker = document.createElement('span');
			marker.textContent =
				(prefix ? prefix + ' ' : '') + i + ': ' + offset.position;
			marker.style.position = 'absolute';
			marker.style.display = 'block';
			marker.style.right = '0';
			marker.style.top = y + 'px';
			marker.style.minWidth = '50px';
			marker.style.height = '2px';
			marker.style.paddingRight = '10px';
			marker.style.backgroundColor = 'red';
			marker.style.zIndex = '100000';

			document.body.appendChild(marker);
			this.debugMarkers.push(marker);
		});
	}

	private _onScroll({ y, height }: { y: number; height: number }) {
		this.init();

		const pos = this.calcPosition({ y, height });
		const clampPos = Math.min(1, Math.max(0, pos));
		const state = pos < 0 ? 'before' : pos > 1 ? 'after' : 'in';

		// we need to trigger once
		// if the pos is not the same and but pos can have 3 states
		// under (<0), in (0-1) or over (>1)
		// each state should be triggered once
		if (this.lastSeek?.pos === clampPos && this.lastSeek?.state === state) {
			return;
		}

		this.lastSeek = { pos: clampPos, state };

		this._events.trigger('update', clampPos, state);

		for (const timeline of this.timelines) {
			timeline.seek(pos);
		}
	}

	/**
	 * @ignore
	 */
	private _onResponsive(
		_a: { width: number; height: number },
		_b: { remove: () => void },
	) {
		this.update();

		// reposition debug Markers
		if (this.debugMarkers.length) {
			for (const marker of this.debugMarkers) {
				marker.remove();
			}

			this.debug(this.debugPrefix);
		}
	}

	private calcPosition({ y, height }: { y: number; height: number }): number {
		// check if it's outside of the bounds
		const first = this.offsets[0];
		if (y < first.y - height * first.view) return -1;

		const last = this.offsets[this.offsets.length - 1];
		if (y > last.y - height * last.view) return 2;

		// find the matching offset
		// rolling window
		for (let i = 1; i < this.offsets.length; i++) {
			const start = this.offsets[i - 1];
			const end = this.offsets[i];

			const startY = start.y - height * start.view;
			const endY = end.y - height * end.view;

			if (y >= startY && y < endY) {
				const dif = endY - startY;
				const x = 1 - (endY - y) / dif;

				return start.position + (end.position - start.position) * x;
			}
		}

		return -1;
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
		position,
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

	if (typeof val !== 'number') {
		throw new Error(
			'view expecting to be a top/center/bottom or a percent value',
		);
	}

	return val;
}
