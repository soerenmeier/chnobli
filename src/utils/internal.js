
export function takeProp(props, name, def = null) {
	const v = props[name] ?? def;
	delete props[name];

	return v;
}