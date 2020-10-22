import { derived, writable, get } from 'svelte/store';

function index (getter, setter = () => { }, stores = []) {

	let resolve;
	const initial = new Promise(res => resolve = res);

	const derived$ = derived(stores, values => values);

	const store$ = writable(initial, set => {
		return derived$.subscribe(async (values = []) => {
			let value = getter(...values);
			if (value === undefined) return;
			value = Promise.resolve(value);
			set(value);
			resolve(value);
		});
	});

	async function set(newValue, oldValue) {
		if (newValue === oldValue) return;
		store$.set(Promise.resolve(newValue));
		try {
			await setter(newValue, oldValue);
		} catch (err) {
			store$.set(Promise.resolve(oldValue));
			throw err;
		}
	}

	return {
		subscribe: store$.subscribe,
		async update(reducer) {
			if (!setter) return;
			const oldValue = await get(store$);
			const newValue = await reducer(shallowCopy(oldValue));
			await set(newValue, oldValue);
		},
		async set(newValue) {
			if (!setter) return;
			const oldValue = await get(store$);
			newValue = await newValue;
			await set(newValue, oldValue);
		},
		get() {
			return get(store$);
		}
	};
}

function shallowCopy(value) {
	if (typeof value !== 'object' || value === null) return value;
	return Array.isArray(value) ? [...value] : { ...value };
}

export default index;