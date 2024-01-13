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
		expect(timing.position).toBe(.6);

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
});