let ROOT_ELEMENT = null;

export default class TestDomNode {
	constructor() {
		this.computedStyle = {
			getPropertyValue(k) {
				return this[k];
			}
		};

		this.style = {
			setProperty: (k, v) => {
				this.style[k] = v;
			},
			removeProperty: (k) => {
				delete this.style[k];
			}
		};

		this.classList = {
			set: new Set,
			contains(name) {
				return this.set.has(name);
			},
			add(name) {
				this.set.add(name);
			},
			remove(name) {
				this.set.delete(name);
			}
		};
	}

	syncStyles() {
		this.computedStyle = { ...this.style };
	}

	static getComputedStyle(el) {
		return el.computedStyle;
	}

	__simulatedDom__() {}

	__getComputedStyleFn__() {
		return TestDomNode.getComputedStyle;
	}

	__getRootElementFn__() {
		return getRootElement;
	}
}

export function el() {
	return new TestDomNode();
}

export function getRootElement() {
	if (!ROOT_ELEMENT)
		ROOT_ELEMENT = el();
	return ROOT_ELEMENT;
}