import { describe, expect, it } from 'vitest';
import Timing, {
	STATE_BEFORE, STATE_START, STATE_RUNNING, STATE_ENDED, STATE_AFTER
} from '../timing/timing.js';

describe('timing', () => {
	it('short timing', () => {
		const timing = new Timing({
			duration: 0
		});
		expect(timing.duration).toBe(1);
		expect(timing.state).toBe(STATE_BEFORE);

		timing.seek(-1);
		expect(timing.position).toBe(0);
		expect(timing.state).toBe(STATE_BEFORE);

		timing.seek(0);
		expect(timing.position).toBe(0);
		expect(timing.state).toBe(STATE_START);

		timing.seek(.5);
		expect(timing.position).toBe(.5);
		expect(timing.state).toBe(STATE_RUNNING);

		timing.seek(1);
		expect(timing.position).toBe(1);
		expect(timing.state).toBe(STATE_ENDED);

		timing.seek(2);
		expect(timing.position).toBe(1);
		expect(timing.state).toBe(STATE_AFTER);

		timing.seekMs(-1);
		expect(timing.position).toBe(0);
		expect(timing.state).toBe(STATE_BEFORE);

		timing.seekMs(0);
		expect(timing.position).toBe(0);
		expect(timing.state).toBe(STATE_START);

		timing.seekMs(.5);
		expect(timing.position).toBe(.5);
		expect(timing.state).toBe(STATE_RUNNING);

		timing.seekMs(1);
		expect(timing.position).toBe(1);
		expect(timing.state).toBe(STATE_ENDED);

		timing.seekMs(2);
		expect(timing.position).toBe(1);
		expect(timing.state).toBe(STATE_AFTER);
	});

	it('state management', () => {
		const timing = new Timing({
			duration: 100
		});

		timing.advance(20);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(.2);

		timing.advance(20);
		expect(timing.positionMs()).toBe(40);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(.4);

		timing.advance(20);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(Math.floor(timing.position * 10) / 10).toBe(.6);

		timing.advance(20);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(.8);

		timing.advance(20);
		expect(timing.state).toBe(STATE_ENDED);
		expect(timing.position).toBe(1);

		timing.advance(20);
		expect(timing.state).toBe(STATE_AFTER);
		expect(timing.position).toBe(1);
	});

	it('reverse', () => {
		const timing = new Timing({
			duration: 100
		});

		expect(timing.state).toBe(STATE_BEFORE);
		expect(timing.position).toBe(0);

		timing.reverse();
		// inverse
		expect(timing.state).toBe(STATE_AFTER);
		expect(timing.position).toBe(0);

		timing.reverse();
		expect(timing.state).toBe(STATE_BEFORE);
		expect(timing.position).toBe(0);

		timing.advance(25);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(0.25);

		timing.reverse();
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(0.25);
		timing.advance(24);
		expect(timing.state).toBe(STATE_RUNNING);
		timing.advance(1);
		expect(timing.state).toBe(STATE_ENDED);
		expect(timing.position).toBe(0);

		timing.seek(0.75);
		timing.reverse();
		expect(timing.position).toBe(0.75);
	});

	it('repeat', () => {
		const timing = new Timing({
			duration: 100,
			repeat: -1
		});

		// >
		timing.advance(25);
		expect(timing.state).toBe(STATE_RUNNING);
		expect(timing.position).toBe(0.25);

		// ><
		timing.advance(100);
		expect(timing.position).toBe(0.75);

		// <
		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// <>
		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// >
		timing.advance(50);
		expect(timing.position).toBe(0.75);

		// <
		timing.reverse();
		expect(timing.position).toBe(0.75);

		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// <>
		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// >
		timing.setAlternate(false);
		timing.advance(50);
		expect(timing.position).toBe(0.75);

		// >
		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// <
		timing.reverse();
		expect(timing.position).toBe(0.25);

		// <
		timing.advance(50);
		expect(timing.position).toBe(0.75);

		// <
		timing.setAlternate(true);
		timing.advance(50);
		expect(timing.position).toBe(0.25);

		// <>
		timing.advance(50);
		expect(timing.position).toBe(0.25);
	});
});