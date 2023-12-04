import Animation from './animation/public.js';
import Timeline from './timeline/public.js';
import Scroll from './scroll/public.js';
import { stagger as _stagger } from './stagger/stagger.js';


// todo maybe add, to, from and fromTo to the animate function


export function animate(targets, props = {}) {
	return new Animation(targets, props);
}

export function timeline(props = {}) {
	return new Timeline(props);
}

export function stagger(value) {
	return _stagger(value);
}

export function scroll(props = {}) {
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