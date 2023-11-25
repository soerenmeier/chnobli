import { takeProp } from './utils/internal.js';
import Animation from './animation/animation.js';


export function animate(target, props = {}) {
	const autoplay = parseAutoplay(takeProp(props, 'autoplay', true));

	const animation = new Animation(target, props);
	if (autoplay)
		animation.play();

	return animation;
}

function parseAutoplay(autoplay) {
	if (autoplay !== true && autoplay !== false)
		throw new Error('autoplay needs to be true|false');

	return autoplay;
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