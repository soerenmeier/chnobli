import { COLORS } from './defaultcolors.js';

export default class ColorValue {
	// [r, g, b, a?]
	constructor(v) {
		if (v.length === 3)
			v = [...v, 1];

		// always [r, g, b, a]
		this.values = v;
	}

	static parse(v) {
		if (Array.isArray(v)) {
			if (v.length < 3 || v.length > 4)
				throw new Error('expected array [r, g, b, a]');

			return new ColorValue(v);
		}

		if (typeof v !== 'string')
			throw new Error('expected a string or an array');

		v = v.trim();

		if (v.startsWith('#'))
			return new ColorValue(parseHex(v.substring(1)));
		if (v.startsWith('rgb'))
			return new ColorValue(parseRgb(v));
		if (v.startsWith('hsl'))
			return new ColorValue(parseHsl(v));

		if (v in COLORS)
			return new ColorValue(COLORS[v]);

		throw new Error('unknown color value ' + v);
	}

	// v needs to be a string
	static mightBeAColor(v) {
		v = v.trim();

		return v.startsWith('#')
			|| v.startsWith('rgb')
			|| v.startsWith('hsl')
			|| v in COLORS;
	}

	clone() {
		return new ColorValue(this.values.slice());
	}

	toString() {
		const [r, g, b, a] = this.values;
		return `rgba(${[r, g, b].map(v => Math.round(v)).join(', ')}, ${
			a.toFixed(3)
		})`;
	}
}

// hex without the hash
function parseHex(hex) {
	if (hex.length !== 3 && hex.length !== 6 && hex.length !== 8)
		throw new Error('unknown hex value ' + hex);

	// Convert 3-character hex to 6-character hex
	if (hex.length === 3)
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];

	// Parse the hex values
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	let a = 255;

	if (hex.length === 8)
		a = parseInt(hex.substring(6, 8), 16);

	return [r, g, b, a / 255];
}

// rgb needs to start with rgb
function parseRgb(rgb) {
	const rgba = rgb.startsWith('rgba');
	// remove the function name
	rgb = rgb.substring(3 + rgba);
	if (!rgb.startsWith('(') && !rgb.endsWith(')'))
		throw new Error('invalid rgb function ' + rgb);

	rgb = rgb.substring(1, rgb.length - 1);
	const vals = rgb.split(',');

	if ((rgba && vals.length !== 4) || vals.length !== 3)
		throw new Error('invalid rgb function ' + rgb);

	const r = parseInt(vals[0].trim());
	const g = parseInt(vals[1].trim());
	const b = parseInt(vals[2].trim());
	const a = rgba ? parseFloat(vals[3].trim()) : 1;

	return [r, g, b, a];
}

// hsl needs to start with hsl
function parseHsl(hsl) {
	const hsla = hsl.startsWith('hsla');
	// Remove the function name
	hsl = hsl.substring(3 + hsla);
	if (!hsl.startsWith('(') || !hsl.endsWith(')'))
		throw new Error('invalid hsl function ' + hsl);

	hsl = hsl.substring(1, hsl.length - 1);
	let vals = hsl.split(',');

	if ((hsla && vals.length !== 4) || (!hsla && vals.length !== 3))
		throw new Error('invalid hsl function ' + hsl);

	vals = vals.map(v => v.trim());

	if (!vals[1].endsWith('%') && !vals[2].endsWith('%'))
		throw new Error('invalid hsl function ' + hsl);

	const h = parseInt(vals[0]);
	const s = parseInt(vals[1].substring(0, vals[1].length - 1));
	const l = parseInt(vals[2].substring(0, vals[2].length - 1));
	const a = hsla ? parseFloat(vals[3]) : 1;

	return hslToRgba([h, s, l, a]);
}

/// expects [h, s, l, a]
function hslToRgba(hsla) {
	let [h, s, l, a] = hsla;

	// normalize
	h /= 360;
	s /= 100;
	l /= 100;

	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < .5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = Math.round(hueToRgb(p, q, h + 1 / 3) * 255, 0);
		g = Math.round(hueToRgb(p, q, h) * 255, 0);
		b = Math.round(hueToRgb(p, q, h - 1 / 3) * 255, 0);
	}

	return [r, g, b, a];
}

function hueToRgb(p, q, t) {
	if (t < 0)
		t += 1;
	if (t > 1)
		t -= 1;

	if (t < 1 / 6)
		return p + (q - p) * 6 * t;
	if (t < 1 / 2)
		return q;
	if (t < 2 / 3)
		return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}