// Recent Node releases ship their own experimental global `localStorage`
// (accessed without a `--localstorage-file`, it resolves to `undefined`
// instead of a working Storage object). Vitest's jsdom environment only
// overrides globals that are either absent from Node or on its own
// override allowlist; `localStorage` is on neither list as of vitest 4.1,
// so on a Node version that defines the global, `window.localStorage` in
// tests silently falls back to Node's non-functional stub instead of
// jsdom's real implementation, and every test touching storage.ts throws
// "Cannot read properties of undefined (reading 'clear'/'getItem'/...)".
//
// The jsdom environment stashes the live `JSDOM` instance on
// `globalThis.jsdom` (see vitest's `environments.jsdom.setup`), so we can
// still reach the real implementation and wire it up ourselves.
const jsdomInstance = (globalThis as { jsdom?: { window: Window } }).jsdom;

if (jsdomInstance) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => jsdomInstance.window.localStorage
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    get: () => jsdomInstance.window.sessionStorage
  });
}
