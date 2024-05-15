/**
 * Take a property from an object and delete it from the object.
 */
export function takeProp<T>(
	props: Record<string, any>,
	name: string,
	def: T,
): T {
	const v = props[name] ?? def;
	delete props[name];

	return v;
}
