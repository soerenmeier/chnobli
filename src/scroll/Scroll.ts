import PublicTimeline from '../timeline/public.js';
import { takeProp } from '../utils/internal.js';
import { pageOffset } from '../utils/utils.js';
import ScrollEvent from './ScrollEvent.js';

/*
run animation when in view (start stop resume when different events happen)



specify when trigger starts: start: "top(triggerEl) center(viewport)"
end: bottom top


startTriger

endTrigger


skew on scroll

scroll pin (once in trigger zone, elements keeps it position relative to start of trigger)

parallax
*/

type StartEndOffset = {
	target: HTMLElement;
	offset: number;
};

export type Start = {
	y: number;
	view: number;
};

export type End = {
	y: number;
	view: number;
};

export default class Scroll {
	private _start: StartEndOffset;
	private _end: StartEndOffset | null;
	private _globalEvent: ScrollEvent;

	start: Start;
	end: End;

	private timelines: PublicTimeline[];
	private _rmEvent: () => void;
	private _initialized: boolean;

	constructor(props = {}) {
		// { target, offset }
		this._start = parseStart(takeProp(props, 'start', null));
		// { target, offset }
		this._end = parseEnd(takeProp(props, 'end', null));
		this._globalEvent = ScrollEvent.global();

		this.start = {
			// px
			y: 0,
			// percentage
			view: parseOffset(takeProp(props, 'startView', 'top')),
		};
		this.end = {
			// px
			y: 0,
			// percentage
			view: parseOffset(takeProp(props, 'endView', 'bottom')),
		};

		this.timelines = [];

		this._rmEvent = this._globalEvent.add(y => this._onScroll(y)).remove;
		this._initialized = false;
	}

	addTimeline(timeline: PublicTimeline) {
		this.timelines.push(timeline);
	}

	init() {
		const startOffset = pageOffset(this._start.target);
		this.start.y =
			startOffset.top + startOffset.height * this._start.offset;

		if (this._end) {
			const offset = pageOffset(this._end.target);
			this.end.y = offset.top + offset.height * this._end.offset;
		} else {
			this.end.y = this.start.y + pageOffset(this._start.target).height;
		}
	}

	_onScroll({ y, height }: { y: number; height: number }) {
		if (!this._initialized) {
			this.init();
			this._initialized = true;
		}

		const start = this.start.y + height * this.start.view;
		const end = this.end.y + height * this.end.view;

		const dif = end - start;
		const x = 1 - (end - y) / dif;

		for (const timeline of this.timelines) {
			timeline.seek(x);
		}
	}
}

function parseStart(val: any): StartEndOffset {
	// might be an object { target, offset }
	if (!val) {
		throw new Error(
			'unknown start property use an html element or an object',
		);
	}

	let element = null;
	let offset = 'top';

	if (typeof val === 'object') {
		if (val instanceof HTMLElement) element = val;
		else if ('target' in val) {
			element = val.target;
			if (typeof val.offset !== 'undefined') offset = val.offset;
		} else {
			throw new Error('start unknown ' + val);
		}
	} else {
		throw new Error('unknown start val');
	}

	return {
		target: element,
		offset: parseOffset(offset),
	};
}

function parseEnd(val: any): StartEndOffset | null {
	// might be an object { target, offset }
	if (!val) return null;

	let element = null;
	let offset = 'top';

	if (typeof val === 'object') {
		if (val instanceof HTMLElement) element = val;
		else if ('target' in val) {
			element = val.target;
			if (typeof val.offset !== 'undefined') offset = val.offset;
		} else {
			throw new Error('start unknown ' + val);
		}
	} else {
		throw new Error('unknown start val');
	}

	return {
		target: element,
		offset: parseOffset(offset),
	};
}

function parseOffset(val: any): number {
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
