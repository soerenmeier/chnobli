import { Target } from '../target/Target';

export type Callback = (change: number, api: { remove: () => void }) => void;

export default interface Ticker {
	registerTarget(target: any): Target;
	unregisterTarget(target: any): void;
	applyTargets(): void;
	add(fn: Callback): { remove: () => void };
	remove(fn: Callback): void;
}
