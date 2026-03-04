const store = new Map();

export function getVariable(name) {
  return store.get(name.toLowerCase()) || null;
}

export function setVariable(name, value) {
  store.set(name.toLowerCase(), value);
}

export function hasVariable(name) {
  return store.has(name.toLowerCase());
}
