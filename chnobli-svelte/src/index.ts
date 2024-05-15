import { onDestroy } from 'svelte';
import type { Timeline } from 'chnobli';

export type CreateTransition<A extends undefined> = (
	el: HTMLElement,
	args: A,
) => Timeline;

export type TimelineTransition = any;

export function createTransition<A extends undefined>(
	fn: CreateTransition<A>,
): TimelineTransition {
	let tl: Timeline | undefined;

	onDestroy(() => {
		tl?.destroy();
	});

	return (node: HTMLElement, args: any, opts: any) => {
		console.log('create Transition');
		tl = fn(node, args);
		tl._inner.init();

		const forward = (t: number) => tl!.seek(t);
		const backward = (_t: any, t: number) => tl!.seek(t);

		return {
			duration: tl._inner.timing.duration,
			delay: args?.delay,
			// we're always one frame behind svelte
			// but maybe that's not that important?
			tick: opts.direction === 'out' ? backward : forward,
		};
	};
}
