import { Target } from '../target/Target.js';
import Property, { type ParseableValue } from './Property.js';

export type Interpolated = {
	add: string[];
	remove: string[];
};

/**
 * In most cases we wan't to add the class at pos 0
 * and in reverse remove it at pos 0
 *
 * so this behaviour should be in str|{ to }
 *
 * If we wan't to remove the class at pos 1
 * and in reverse add it at pos 1
 * we do it in { from }
 */
export default class ClassProperty implements Property<string[], Interpolated> {
	name: string;

	from!: string[];
	to!: string[];

	private preStates!: Map<string, boolean>;
	private states!: Map<string, boolean>;

	constructor(name: string) {
		this.name = name;
	}

	allowsValueFn(): boolean {
		return false;
	}

	init(target: Target, from: string[] | null, to: string[] | null) {
		this.from = from ?? [];
		this.to = to ?? [];

		this.preStates = new Map();
		this.states = new Map();

		for (const cls of [...this.from, ...this.to]) {
			const exists = target.hasClass(cls);
			this.preStates.set(cls, exists);
			this.states.set(cls, exists);
		}
	}

	parseValue(val: ParseableValue): string[] {
		if (Array.isArray(val)) {
			return val.map(v => {
				if (typeof v !== 'string')
					throw new Error('cls only accepts strings[]');

				return v;
			});
		}

		if (typeof val === 'string') return [val];

		throw new Error('cls only accepts strings and strings[]');
	}

	getValue(_target: Target): string[] | null {
		throw new Error('unused');
	}

	interpolate(pos: number): Interpolated {
		/**
		 * ## to
		 * add the class at pos >0
		 * and in reverse remove it at pos 0
		 *
		 * ## from
		 * remove the class at pos <1
		 * and in reverse add it at pos 1
		 */

		let obj: Interpolated = {
			add: [],
			remove: [],
		};

		if (pos <= 0) {
			obj.remove = this.to;
		} else {
			obj.add = this.to;
		}

		if (pos >= 1) {
			obj.remove = this.from;
		} else {
			obj.add = [...obj.add, ...this.from];
		}

		return obj;
	}

	setValue(target: Target, val: Interpolated) {
		let { add, remove } = val;
		add = add ?? [];
		remove = remove ?? [];

		if (!Array.isArray(add) || !Array.isArray(remove))
			throw new Error('add or remove expected');

		add.forEach(cls => {
			const exists = this.states.get(cls);
			if (!exists) {
				target.addClass(cls);
				this.states.set(cls, true);
			}
		});

		remove.forEach(cls => {
			const exists = this.states.get(cls);
			if (exists) {
				target.removeClass(cls);
				this.states.set(cls, false);
			}
		});
	}

	removeValue(target: Target) {
		this.preStates.forEach((exists, cls) => {
			if (exists) target.addClass(cls);
			else target.removeClass(cls);
		});
		this.states = new Map(this.preStates);
	}
}
