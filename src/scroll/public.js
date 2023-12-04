import Scroll from './scroll.js';

export default class PublicScroll {
	/*
	{
		start: el | px
		startView: 'top'
	}
	*/
	constructor(props = {}) {
		this._inner = new Scroll(props);
	}

	add(timeline) {
		this._inner.addTimeline(timeline);
	}
}