function catmullRom(
	p0: number,
	p1: number,
	p2: number,
	p3: number,
	t: number,
	p1Tension: number,
	p2Tension: number,
) {
	const v0 = (p2 - p0) * p1Tension;
	const v1 = (p3 - p1) * p2Tension;
	const t2 = t * t;
	const t3 = t2 * t;

	return (
		(2 * p1 - 2 * p2 + v0 + v1) * t3 +
		(-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
		v0 * t +
		p1
	);
}

export type CurveOptions = {
	startEndStraight?: boolean;
};

export type Point = {
	x: number;
	y: number;
	straight?: boolean;
};

/**
 * Calculates a curve between different points
 */
export function curve(
	points: Point[],
	tension = 1,
	opts: CurveOptions = {},
): (t: number) => { x: number; y: number } {
	if (points.length <= 1) throw new Error('curve expects at least 2 points');

	const startEndStraight = opts.startEndStraight ?? true;
	if (startEndStraight) {
		points[0].straight = true;
		points[points.length - 1].straight = true;
	}

	return t => {
		const segment = Math.floor(t * (points.length - 1));
		const localT = t * (points.length - 1) - segment;

		const p0 = points[Math.max(0, segment - 1)];
		const p1 = points[segment];
		const p2 = points[Math.min(points.length - 1, segment + 1)];
		const p3 = points[Math.min(points.length - 1, segment + 2)];

		let p1Tension = tension;
		let p2Tension = tension;

		if (p1.straight) p1Tension = 0;

		if (p2.straight) p2Tension = 0;

		return {
			x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT, p1Tension, p2Tension),
			y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT, p1Tension, p2Tension),
		};
	};
}
