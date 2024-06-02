import { onDestroy, onMount } from 'svelte';
import type { Timeline } from 'chnobli';
import { scroll as newScroll, Scroll } from 'chnobli/scroll';

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
		tl = undefined;
	});

	return (node: HTMLElement, args: any, opts: any) => {
		tl = fn(node, args);

		if (!tl) return { duration: 0 };

		tl._inner.init();

		// weirdly it happens that onDestroy is called but then forward
		// or backward is called again
		const forward = (t: number) => tl?.seek(t);
		const backward = (_t: any, t: number) => tl?.seek(t);

		return {
			duration: tl._inner.timing.duration,
			delay: args?.delay,
			// we're always one frame behind svelte
			// but maybe that's not that important?
			tick: opts.direction === 'out' ? backward : forward,
		};
	};
}

export function scroll(fn: (scroll: Scroll) => void) {
	let scr = newScroll();

	onMount(() => {
		fn(scr);
	});

	onDestroy(() => {
		scr?.destroy();
	});
}
