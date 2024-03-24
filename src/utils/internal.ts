export function takeProp(
	props: Record<string, any>,
	name: string,
	def: any = null,
): any {
	const v = props[name] ?? def;
	delete props[name];

	return v;
}
