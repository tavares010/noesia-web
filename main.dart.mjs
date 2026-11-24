// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: x0 => x0.next(),
      AH: (x0,x1) => x0.querySelectorAll(x1),
      AI: (x0,x1) => { x0.title = x1 },
      AJ: x0 => x0.response,
      AK: () => new Array(),
      AL: x0 => x0.metaKey,
      AM: (x0,x1) => { x0.focusMode = x1 },
      AN: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      AO: x0 => x0.target,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.current(),
      BH: (d, digits) => d.toFixed(digits),
      BI: (x0,x1) => x0.vibrate(x1),
      BJ: (x0,x1) => { x0.responseType = x1 },
      BK: (x0,x1) => new WebSocket(x0,x1),
      BL: x0 => x0.altKey,
      BM: x0 => x0.focusMode,
      BN: (x0,x1,x2,x3,x4) => x0.getImageData(x1,x2,x3,x4),
      BO: (x0,x1) => { x0.display = x1 },
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      CH: x0 => x0.maxHeight,
      CI: x0 => x0.content,
      CJ: x0 => x0.vendor,
      CK: x0 => x0.reason,
      CL: x0 => x0.ctrlKey,
      CM: x0 => x0.enumerateDevices(),
      CN: (x0,x1,x2) => x0.readBarcodes(x1,x2),
      CO: (x0,x1) => { x0.accept = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.v8BreakIterator,
      DH: x0 => x0.maxWidth,
      DI: x0 => x0.document,
      DJ: x0 => x0.navigator,
      DK: x0 => x0.code,
      DL: x0 => x0.isComposing,
      DM: x0 => x0.deviceId,
      DN: x0 => x0.text,
      DO: (x0,x1) => { x0.multiple = x1 },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: () => globalThis.Intl,
      EH: x0 => x0.minHeight,
      EI: (x0,x1) => x0.revokeObjectURL(x1),
      EJ: () => globalThis.window,
      EK: (o, t) => typeof o === t,
      EL: x0 => x0.code,
      EM: x0 => x0.kind,
      EN: x0 => x0.format,
      EO: (x0,x1) => { x0.draggable = x1 },
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: (x0,x1) => x0.segment(x1),
      FH: x0 => x0.minWidth,
      FI: (x0,x1) => { x0.src = x1 },
      FJ: x0 => new Blob(x0),
      FK: x0 => x0.data,
      FL: x0 => x0.repeat,
      FM: x0 => x0.mediaDevices,
      FN: x0 => x0.bytes,
      FO: (x0,x1) => { x0.type = x1 },
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.index,
      GH: (x0,x1) => x0.removeProperty(x1),
      GI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      GJ: x0 => globalThis.fetch(x0),
      GK: (x0,x1,x2) => x0.close(x1,x2),
      GL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GM: x0 => x0.facingMode,
      GN: x0 => x0.y,
      GO: x0 => x0.length,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: x0 => x0.next(),
      HH: (x0,x1) => x0.add(x1),
      HI: x0 => x0.naturalHeight,
      HJ: x0 => x0.arrayBuffer(),
      HK: (x0,x1) => x0.close(x1),
      HL: x0 => x0.userAgent,
      HM: x0 => x0.mediaDevices,
      HN: x0 => x0.x,
      HO: x0 => x0.getReader(),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.value,
      IH: x0 => x0.data,
      II: x0 => x0.naturalWidth,
      IJ: (x0,x1) => x0.createElement(x1),
      IK: x0 => x0.close(),
      IL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      IM: () => globalThis.BarcodeDetector.getSupportedFormats(),
      IN: x0 => x0.bottomLeft,
      IO: x0 => x0.value,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: x0 => x0.done,
      JH: (x0,x1) => { x0.scrollTop = x1 },
      JI: x0 => x0.decode(),
      JJ: (x0,x1) => x0.append(x1),
      JK: (x0,x1) => x0.send(x1),
      JL: (x0,x1) => x0.key(x1),
      JM: (x0,x1) => x0.call(x1),
      JN: x0 => x0.bottomRight,
      JO: x0 => x0.done,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: (o, m, a) => o[m].apply(o, a),
      KH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      KI: (x0,x1) => { x0.decoding = x1 },
      KJ: (x0,x1,x2) => x0.insertRule(x1,x2),
      KK: x0 => x0.readyState,
      KL: x0 => x0.length,
      KM: x0 => x0.reset,
      KN: x0 => x0.topRight,
      KO: x0 => x0.read(),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: x0 => x0.iterator,
      LH: (x0,x1) => { x0.value = x1 },
      LI: (x0,x1) => { x0.crossOrigin = x1 },
      LJ: (x0,x1) => x0.add(x1),
      LK: (x0,x1) => { x0.binaryType = x1 },
      LL: (x0,x1) => x0.canShare(x1),
      LM: x0 => x0.stopContinuousDecode,
      LN: x0 => x0.topLeft,
      LO: x0 => x0.body,
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: () => globalThis.Symbol,
      MH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      MI: (x0,x1) => x0.createObjectURL(x1),
      MJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MK: x0 => new BroadcastChannel(x0),
      ML: (x0,x1) => x0.share(x1),
      MM: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      MN: x0 => x0.position,
      MO: (x0,x1) => new OffscreenCanvas(x0,x1),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: (x0,x1) => new Intl.Segmenter(x0,x1),
      NH: (x0,x1) => { x0.value = x1 },
      NI: x0 => x0.URL,
      NJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      NK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NL: x0 => x0.message,
      NM: (x0,x1,x2,x3) => x0.call(x1,x2,x3),
      NN: x0 => x0.isValid,
      NO: x0 => x0.assetBase,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: x0 => x0.Segmenter,
      OH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      OI: x0 => new Blob(x0),
      OJ: x0 => x0.preventDefault(),
      OK: x0 => x0.close(),
      OL: (x0,x1) => ({files: x0,text: x1}),
      OM: x0 => x0.text,
      ON: (x0,x1,x2,x3) => ({formats: x0,tryHarder: x1,tryRotate: x2,tryInvert: x3}),
      OO: x0 => x0.loader,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: x0 => x0.flags,
      PG: x0 => x0.buffer,
      PH: x0 => x0.value,
      PI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      PJ: x0 => x0.createRange(),
      PK: (x0,x1) => x0.postMessage(x1),
      PL: x0 => ({files: x0}),
      PM: x0 => x0.barcodeFormat,
      PN: (x0,x1,x2) => ({tryHarder: x0,tryRotate: x1,tryInvert: x2}),
      PO: () => globalThis._flutter,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: x0 => x0.wasmMemory,
      QH: x0 => x0.selectionDirection,
      QI: x0 => new window.ImageDecoder(x0),
      QJ: (x0,x1) => x0.selectNode(x1),
      QK: (x0,x1) => { x0.onmessage = x1 },
      QL: x0 => ({text: x0}),
      QM: x0 => x0.rawBytes,
      QN: () => globalThis.ZXingWASM,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: () => globalThis.window._flutter_skwasmInstance,
      RH: x0 => x0.selectionStart,
      RI: x0 => x0.name,
      RJ: x0 => x0.getSelection(),
      RK: () => new AbortController(),
      RL: x0 => x0.getTracks(),
      RM: x0 => x0.y,
      RN: (x0,x1) => { x0.height = x1 },
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: () => new TextDecoder(),
      SH: x0 => x0.selectionEnd,
      SI: x0 => x0.repetitionCount,
      SJ: x0 => x0.removeAllRanges(),
      SK: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      SL: x0 => x0.stop(),
      SM: x0 => x0.x,
      SN: (x0,x1) => { x0.width = x1 },
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: (x0,x1) => x0.getRandomValues(x1),
      TH: x0 => x0.value,
      TI: x0 => x0.frameCount,
      TJ: (x0,x1) => x0.addRange(x1),
      TK: (x0,x1) => globalThis.fetch(x0,x1),
      TL: (x0,x1) => { x0.transform = x1 },
      TM: x0 => x0.resultPoints,
      TN: x0 => x0.height,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.left,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.blur(),
      UG: () => globalThis.crypto,
      UH: x0 => x0.selectionDirection,
      UI: x0 => x0.selectedTrack,
      UJ: () => globalThis.window,
      UK: (x0,x1) => x0.get(x1),
      UL: x0 => x0.style,
      UM: x0 => x0.message,
      UN: x0 => x0.width,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.clientY,
      VE: x0 => x0.language,
      VF: x0 => x0.button,
      VG: l => new DataView(new ArrayBuffer(l)),
      VH: x0 => x0.selectionStart,
      VI: x0 => x0.completed,
      VJ: (x0,x1) => { x0.innerText = x1 },
      VK: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      VL: x0 => x0.getVideoTracks(),
      VM: x0 => x0.videoElement,
      VN: (x0,x1) => { x0.srcObject = x1 },
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientX,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.innerHeight,
      WG: (a, i) => a.splice(i, 1),
      WH: x0 => x0.selectionEnd,
      WI: x0 => x0.ready,
      WJ: x0 => x0.offsetY,
      WK: (x0,x1) => x0.forEach(x1),
      WL: x0 => x0.getSettings(),
      WM: x0 => x0.decodeContinuously,
      WN: x0 => ({willReadFrequently: x0}),
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.changedTouches,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.innerWidth,
      XG: a => a.pop(),
      XH: x0 => x0.keyCode,
      XI: x0 => x0.tracks,
      XJ: x0 => x0.offsetX,
      XK: x0 => x0.name,
      XL: x0 => x0.facingMode,
      XM: (x0,x1) => new ZXing.BrowserMultiFormatReader(x0,x1),
      XN: (x0,x1,x2) => x0.getContext(x1,x2),
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: (map, o, v) => map.set(o, v),
      YH: (x0,x1) => x0.scrollIntoView(x1),
      YI: x0 => x0.close(),
      YJ: x0 => x0.button,
      YK: x0 => x0.statusText,
      YL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YM: (x0,x1) => ({width: x0,height: x1}),
      YN: () => new BarcodeDetector(),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: (map, o) => map.get(o),
      ZH: x0 => x0.multiViewEnabled,
      ZI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      ZJ: x0 => x0.classList,
      ZK: x0 => x0.url,
      ZL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZM: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      ZN: x0 => ({formats: x0}),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: () => new WeakMap(),
      aH: (x0,x1) => x0.replaceWith(x1),
      aI: (x0,x1) => x0.decode(x1),
      aJ: (x0,x1) => { x0.height = x1 },
      aK: x0 => x0.status,
      aL: (x0,x1) => x0.append(x1),
      aM: x0 => x0.facingMode,
      aN: x0 => new BarcodeDetector(x0),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.maxTouchPoints,
      bE: (x0,x1) => x0.contains(x1),
      bF: x0 => x0.clientWidth,
      bG: x0 => x0.debugSkipFontRetryDelay,
      bH: (x0,x1) => { x0.type = x1 },
      bI: x0 => x0.displayHeight,
      bJ: (x0,x1) => { x0.width = x1 },
      bK: x0 => x0.getReader(),
      bL: (x0,x1) => x0.createElement(x1),
      bM: x0 => x0.height,
      bN: (x0,x1) => x0.detect(x1),
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: x0 => x0.status,
      cH: (x0,x1) => { x0.className = x1 },
      cI: x0 => x0.displayWidth,
      cJ: x0 => x0.style,
      cK: x0 => x0.read(),
      cL: () => globalThis.document,
      cM: x0 => x0.width,
      cN: x0 => x0.rawValue,
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.body,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => { x0.name = x1 },
      dG: (x0,x1,x2) => x0.set(x1,x2),
      dH: (x0,x1) => { x0.tabIndex = x1 },
      dI: x0 => x0.duration,
      dJ: x0 => x0.sheet,
      dK: x0 => x0.value,
      dL: (x0,x1) => { x0.onpause = x1 },
      dM: x0 => x0.attachStreamToVideo,
      dN: x0 => x0.format,
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: x0 => x0.arrayBuffer(),
      eH: (x0,x1) => { x0.name = x1 },
      eI: x0 => x0.image,
      eJ: x0 => x0.head,
      eK: x0 => x0.done,
      eL: (x0,x1) => { x0.onplay = x1 },
      eM: () => new Map(),
      eN: x0 => x0.y,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.classList,
      fF: (x0,x1) => x0.removeChild(x1),
      fG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      fH: (x0,x1) => { x0.placeholder = x1 },
      fI: () => globalThis.window.ImageDecoder,
      fJ: () => globalThis.document,
      fK: x0 => x0.cancel(),
      fL: (x0,x1) => { x0.controls = x1 },
      fM: (x0,x1,x2) => x0.set(x1,x2),
      fN: x0 => x0.x,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: (x0,x1) => x0.fetch(x1),
      gH: (x0,x1) => { x0.autocomplete = x1 },
      gI: (o, p) => p in o,
      gJ: (x0,x1,x2) => x0.insertBefore(x1,x2),
      gK: x0 => x0.body,
      gL: (x0,x1) => { x0.pointerEvents = x1 },
      gM: (x0,x1) => x0.querySelector(x1),
      gN: x0 => x0.cornerPoints,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: x0 => x0.fontFallbackBaseUrl,
      hH: (x0,x1) => { x0.name = x1 },
      hI: x0 => x0.groups,
      hJ: x0 => x0.id,
      hK: x0 => x0.headers,
      hL: (x0,x1) => { x0.transformOrigin = x1 },
      hM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hN: () => globalThis.removeSplashFromWeb(),
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: (handle) => clearInterval(handle),
      iH: (x0,x1) => { x0.placeholder = x1 },
      iI: x0 => new WeakRef(x0),
      iJ: x0 => x0.offsetHeight,
      iK: x0 => x0.signal,
      iL: (x0,x1) => { x0.objectFit = x1 },
      iM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iN: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      jH: (x0,x1) => { x0.action = x1 },
      jI: x0 => x0.deref(),
      jJ: x0 => x0.offsetWidth,
      jK: x0 => x0.abort(),
      jL: (x0,x1) => { x0.width = x1 },
      jM: (x0,x1) => x0.appendChild(x1),
      jN: x0 => x0.sessionStorage,
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: () => Date.now(),
      kH: (x0,x1) => { x0.method = x1 },
      kI: () => globalThis.WeakRef,
      kJ: x0 => x0.stopPropagation(),
      kK: (x0,x1) => x0.transferFromImageBitmap(x1),
      kL: (x0,x1) => { x0.height = x1 },
      kM: x0 => x0.head,
      kN: x0 => x0.body,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.ctrlKey,
      lF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      lG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      lH: (x0,x1) => { x0.noValidate = x1 },
      lI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      lJ: x0 => x0.disabled,
      lK: (x0,x1) => x0.getContext(x1),
      lL: x0 => x0.getSupportedConstraints(),
      lM: (x0,x1) => { x0.onerror = x1 },
      lN: (x0,x1,x2) => x0.addEventListener(x1,x2),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.y,
      mF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      mG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      mH: (x0,x1) => x0.removeAttribute(x1),
      mI: (a, s, e) => a.slice(s, e),
      mJ: (x0,x1) => { x0.min = x1 },
      mK: (x0,x1) => { x0.height = x1 },
      mL: x0 => ({ideal: x0}),
      mM: (x0,x1) => x0.removeChild(x1),
      mN: x0 => x0.click(),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.x,
      nF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      nG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      nH: x0 => x0.isConnected,
      nI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      nJ: (x0,x1) => { x0.max = x1 },
      nK: (x0,x1) => { x0.width = x1 },
      nL: (x0,x1,x2) => ({width: x0,height: x1,deviceId: x2}),
      nM: (x0,x1) => { x0.onload = x1 },
      nN: x0 => x0.firstChild,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: () => typeof dartUseDateNowForTicks !== "undefined",
      oG: x0 => x0.history,
      oH: x0 => x0.click(),
      oI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      oJ: (x0,x1) => { x0.disabled = x1 },
      oK: x0 => x0.height,
      oL: x0 => ({video: x0}),
      oM: (x0,x1) => { x0.src = x1 },
      oN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: () => Date.now(),
      pG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pH: (x0,x1) => x0.getElementsByClassName(x1),
      pI: () => new FileReader(),
      pJ: (x0,x1) => { x0.scrollLeft = x1 },
      pK: x0 => x0.width,
      pL: (x0,x1) => ({width: x0,height: x1}),
      pM: (x0,x1) => { x0.crossOrigin = x1 },
      pN: (x0,x1) => x0.item(x1),
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: () => 1000 * performance.now(),
      qG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      qH: (x0,x1) => x0.dispatchEvent(x1),
      qI: (x0,x1) => x0.readAsArrayBuffer(x1),
      qJ: (x0,x1) => { x0.spellcheck = x1 },
      qK: x0 => x0.rasterEndMilliseconds,
      qL: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      qM: (x0,x1) => { x0.lang = x1 },
      qN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: (x0,x1) => x0.requestAnimationFrame(x1),
      rG: o => Object.keys(o),
      rH: (x0,x1) => x0.createEvent(x1),
      rI: x0 => x0.result,
      rJ: (x0,x1) => { x0.disabled = x1 },
      rK: x0 => x0.rasterStartMilliseconds,
      rL: (x0,x1) => x0.getUserMedia(x1),
      rM: (x0,x1) => { x0.type = x1 },
      rN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sG: x0 => x0.state,
      sH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      sI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sJ: (x0,x1) => x0.getItem(x1),
      sK: x0 => x0.imageBitmaps,
      sL: x0 => x0.deviceId,
      sM: (x0,x1) => { x0.defer = x1 },
      sN: x0 => globalThis.URL.createObjectURL(x0),
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: x0 => x0.now(),
      tG: x0 => x0.state,
      tH: x0 => x0.readText(),
      tI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      tJ: x0 => x0.localStorage,
      tK: x0 => x0.canvasKitMaximumSurfaces,
      tL: x0 => x0.getCapabilities(),
      tM: (x0,x1) => { x0.async = x1 },
      tN: x0 => x0.name,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: x0 => x0.performance,
      uG: (x0,x1) => x0.go(x1),
      uH: x0 => x0.clipboard,
      uI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      uJ: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      uK: x0 => x0.nextSibling,
      uL: () => ({}),
      uM: (x0,x1) => { x0.id = x1 },
      uN: x0 => x0.size,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: x0 => new Uint8Array(x0),
      vG: x0 => x0.hash,
      vH: (x0,x1) => x0.writeText(x1),
      vI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      vJ: x0 => x0.history,
      vK: (x0,x1) => x0.debug(x1),
      vL: (x0,x1) => x0.applyConstraints(x1),
      vM: x0 => x0.videoHeight,
      vN: x0 => x0.parentNode,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: (x0,x1,x2) => x0.slice(x1,x2),
      wG: x0 => x0.location,
      wH: x0 => x0.unlock(),
      wI: () => new XMLHttpRequest(),
      wJ: x0 => x0.href,
      wK: x0 => x0.baseURI,
      wL: (x0,x1) => { x0.whiteBalanceMode = x1 },
      wM: x0 => x0.videoWidth,
      wN: x0 => x0.length,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: (x0,x1) => x0.decode(x1),
      xG: x0 => x0.search,
      xH: (x0,x1) => x0.lock(x1),
      xI: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      xJ: x0 => x0.location,
      xK: x0 => x0.hostElement,
      xL: x0 => x0.whiteBalanceMode,
      xM: x0 => x0.stream,
      xN: x0 => x0.files,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: (x0,x1) => x0.adoptText(x1),
      yG: x0 => x0.pathname,
      yH: x0 => x0.orientation,
      yI: x0 => x0.send(),
      yJ: (x0,x1) => x0.removeItem(x1),
      yK: x0 => x0.location,
      yL: (x0,x1) => { x0.exposureMode = x1 },
      yM: x0 => x0.play(),
      yN: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: x0 => x0.first(),
      zG: x0 => x0.parentElement,
      zH: (x0,x1) => x0.querySelector(x1),
      zI: x0 => x0.type,
      zJ: (x0,x1,x2) => x0.setItem(x1,x2),
      zK: (x0,x1) => x0.getModifierState(x1),
      zL: x0 => x0.exposureMode,
      zM: x0 => x0.paused,
      zN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      s: [
        "([ \r\n\t]+)|([!-\\[\\]-‧‪-퟿豈-￿][̀-ͯ]*|[\ud800-\udbff][\udc00-\udfff][̀-ͯ]*|\\\\verb\\*([^]).*?\\3|\\\\verb([^*a-zA-Z]).*?\\4|\\\\operatorname\\*|\\\\[a-zA-Z@]+[ \r\n\t]*|\\\\[^\ud800-\udfff])",
      ],
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
