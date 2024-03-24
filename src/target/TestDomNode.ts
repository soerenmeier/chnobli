let ROOT_ELEMENT: TestDomNode | null = null;

export default class TestDomNode {
	computedStyle: any;
	style: any;
	classList: any;

	constructor() {
		this.computedStyle = {
			getPropertyValue(k: string) {
				return this[k];
			},
		};

		this.style = {
			setProperty: (k: string, v: string) => {
				this.style[k] = v;
			},
			removeProperty: (k: string) => {
				delete this.style[k];
			},
		};

		this.classList = {
			set: new Set(),
			contains(name: string) {
				return this.set.has(name);
			},
			add(name: string) {
				this.set.add(name);
			},
			remove(name: string) {
				this.set.delete(name);
			},
		};
	}

	syncStyles() {
		this.computedStyle = { ...this.style };
	}

	static getComputedStyle(el: TestDomNode): CSSStyleDeclaration {
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
	if (!ROOT_ELEMENT) ROOT_ELEMENT = el();
	return ROOT_ELEMENT;
}
