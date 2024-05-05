import Animation from './animation/public.js';
import Timeline from './timeline/public.js';
import Scroll from './scroll/public.js';
import Stagger from './stagger/stagger.js';

export type { Animation, Timeline, Stagger, Scroll };

// todo maybe add, to, from and fromTo to the animate function

/**
 * Creates a simple animation
 *
 * ## Properties
 *
 */
export function animate(
	targets: any,
	props: Record<string, any> = {},
): Animation {
	return new Animation(targets, props);
}

export function timeline(props: Record<string, any> = {}): Timeline {
	return new Timeline(props);
}

export function stagger(value: any): Stagger {
	return new Stagger(value);
}

export function scroll(props: Record<string, any> = {}): Scroll {
	return new Scroll(props);
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
