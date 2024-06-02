import type { Position, ScrollTrigger } from './Scroll.js';
import Scroll from './public.js';

export { Scroll, ScrollTrigger, Position };

/**
 * Create a scroll animation
 */
export function scroll(): Scroll {
	return new Scroll();
}
