/*

const obj = { opacity: 1 };
// maybe we could even have stagger?
const opacity = animator(obj, {
	// initial value
	// might also be able to be set with stagger?
	// for example
	opacity: 1,

	duration: 200,
	ease: sineInOut
});

// or maybe instead

const animator = animator();
animator.add(obj, {
	opacity: 1,
	duration: 200,
	ease: sineInOut
});

// what is the reason why we would wan't one animator with
// multiple objects with different timings
// could we not just use multiple animators


opacity.set(obj, { opacity: 0 });

let's make the most basic animator first


const opacity = animator(obj, {
	duration: 200,
	ease: sinInOut
});

opacity.set({ opacity: 0 });

opacity.to({ opacity: 1 });
opacity.to({ opacity: 2 }, 1000);




*/

import Animator, { AnimatorProps } from './public.js';

export { Animator };
export type { AnimatorProps };

export function animator(target: any, props?: AnimatorProps): Animator {
	return new Animator(target, props);
}
