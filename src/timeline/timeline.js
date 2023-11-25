export default class Timeline {
	constructor(props) {

	}

	add(target, props, offset = null) {
		return this;
	}

	label(label, offset = null) {
		return this;
	}

	play() {}

	seek(t) {}

	pause() {}

	reset() {
		this.seek(0);
	}
}