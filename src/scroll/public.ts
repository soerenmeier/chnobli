import PublicTimeline from '../timeline/public.js';
import Scroll from './Scroll.js';

export default class PublicScroll {
	private _inner: Scroll;

	/*
	{
		start: el | px
		startView: 'top'
	}
	*/
	constructor(props: Record<string, any> = {}) {
		this._inner = new Scroll(props);
	}

	add(timeline: PublicTimeline) {
		this._inner.addTimeline(timeline);
	}
}
