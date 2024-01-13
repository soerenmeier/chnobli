export default class TestDomNode {
	constructor() {
		this.style = {};
	}

	__simulatedDom__() {}
}

export function el() {
	return new TestDomNode();
}