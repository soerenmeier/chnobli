import Animation, { AnimationProps } from './animation/public.js';
import Timeline from './timeline/public.js';
import Stagger, { type StaggerValue } from './stagger/stagger.js';
import type { Targets, AnimationTarget } from './target/Target.js';

export type {
	Animation,
	Timeline,
	Stagger,
	Targets,
	AnimationTarget,
	StaggerValue,
	AnimationProps,
};

// todo maybe add, to, from and fromTo to the animate function

/**
 * Creates a simple animation
 *
 * ## Properties
 *
 */
export function animate(
	targets: Targets,
	props: AnimationProps = {},
): Animation {
	return new Animation(targets, props);
}

export function timeline(props: Record<string, any> = {}): Timeline {
	return new Timeline(props);
}

export function stagger<O>(value: StaggerValue<O>): Stagger<O> {
	return new Stagger(value);
}

/*

animate(target, {
	
	// special
	// translate
	x
	y
	scale
	scaleX
	scaleY
	rotation
	skew
	skewX
	skewY


	
	// stagger
	repeatDelay
	stagger: {
    // wrap advanced options in an object
    each: 0.1,
    from: "center",
    grid: "auto",
    ease: "power2.inOut",
    repeat: -1, // Repeats immediately, not waiting for the other staggered animations to finish
  },


	ease,
	duration,
	repeat, (-1?)
	repeatDelay?
	delay,
	alternate
})

*/
