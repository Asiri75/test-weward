// h3-js ships an emscripten WASM build that decodes utf-16le strings.
// jest-expo installs Expo's "winter" TextDecoder polyfill, which only
// supports utf-8. Restore Node's native TextDecoder/TextEncoder so h3-js loads.
const { TextDecoder, TextEncoder } = require('util');
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
