// h3-js ships an emscripten (WASM) build that decodes utf-16le strings via
// `new TextDecoder('utf-16le')`. Expo's runtime TextDecoder only supports utf-8
// and throws "Unknown encoding: utf-16le", crashing the app at h3-js load.
// This wrapper decodes utf-16le/utf-16 manually and delegates everything else
// to the native decoder. Must be imported before any module that uses h3-js.

const NativeTextDecoder: any = (global as any).TextDecoder;

function decodeUtf16le(input?: ArrayBuffer | ArrayBufferView): string {
  if (!input) return '';
  const bytes =
    input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : new Uint8Array(
          (input as ArrayBufferView).buffer,
          (input as ArrayBufferView).byteOffset,
          (input as ArrayBufferView).byteLength
        );
  let out = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  }
  return out;
}

const isUtf16 = (enc: string) => enc === 'utf-16le' || enc === 'utf-16' || enc === 'utf16le';

class SafeTextDecoder {
  encoding: string;
  private native: any = null;

  constructor(label: string = 'utf-8', options?: any) {
    this.encoding = String(label || 'utf-8').toLowerCase();
    if (!isUtf16(this.encoding) && NativeTextDecoder) {
      try {
        this.native = new NativeTextDecoder(label, options);
      } catch {
        this.native = null;
      }
    }
  }

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (isUtf16(this.encoding)) return decodeUtf16le(input);
    if (this.native) return this.native.decode(input);
    return decodeUtf16le(input);
  }
}

(global as any).TextDecoder = SafeTextDecoder;

export {};
