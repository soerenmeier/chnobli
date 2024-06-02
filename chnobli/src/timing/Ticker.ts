import { Target } from '../target/Target.js';

export type CallbackApi = {
	remove: () => void;
	onApplied: (fn: () => void) => void;
};
export type Callback = (change: number, api: CallbackApi) => void;

export default interface Ticker {
	registerTarget(target: any): Target;
	unregisterTarget(target: any): void;
	applyTargets(): void;
	add(fn: Callback): { remove: () => void };
	remove(fn: Callback): void;
}
