import { takeProp } from './utils/internal.js';
import Animation from './animation/animation.js';
import Timeline from './timeline/timeline.js';
import { STATE_AFTER } from './timing/timing.js';

// todo maybe add, to, from and fromTo to the animate function


export function animate(target, props = {}) {
	const autoplay = parseAutoplay(takeProp(props, 'autoplay', true));

	const animation = new Animation(target, props);
	if (autoplay)
		animation.play();

	return animation;
}

export function timeline(props = {}) {
	const timeline = new Timeline(props);

	let runningTicker = null;

	return {
		add(targets, props, offset = null) {
			timeline.add(targets, props, offset);

			return this;
		},
		label(label, offset = null) {
			timeline.label(label, offset);

			return this;
		},
		play() {
			if (runningTicker)
				return;

			timeline.init();

			// console.log('0.1');
			// timeline.seek(0.1);
			// timeline.render();

			// console.log('0.2');
			// timeline.seek(0.2);
			// timeline.render();

			// console.log('0.3');
			// timeline.seek(0.3);
			// timeline.render();

			runningTicker = timeline.ticker.add((change, opts) => {
				if (timeline.timing.state === STATE_AFTER)
					opts.remove();

				timeline.advance(change);

				timeline.render();
			});
		}
	};
}

export function to(to) {
	return { to };
}

export function from(from) {
	return { from };
}

export function fromTo(from, to) {
	return { from, to };
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