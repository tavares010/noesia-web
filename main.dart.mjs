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
      AH: x0 => x0.parentElement,
      AI: (x0,x1) => x0.querySelector(x1),
      AJ: (x0,x1,x2) => x0.close(x1,x2),
      AK: x0 => x0.stopPropagation(),
      AL: x0 => x0.baseURI,
      AM: (x0,x1) => { x0.whiteBalanceMode = x1 },
      AN: x0 => x0.videoWidth,
      AO: (x0,x1) => { x0.oncancel = x1 },
      AP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      AQ: x0 => x0.assetBase,
      B: s => printToConsole(s),
      BB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.current(),
      BH: (x0,x1) => x0.querySelectorAll(x1),
      BI: (x0,x1) => { x0.title = x1 },
      BJ: (x0,x1) => x0.close(x1),
      BK: x0 => x0.disabled,
      BL: x0 => x0.hostElement,
      BM: x0 => x0.whiteBalanceMode,
      BN: x0 => x0.stream,
      BO: (x0,x1) => { x0.onchange = x1 },
      BP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      BQ: x0 => x0.loader,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Uint16Array(x0),
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      CH: (d, digits) => d.toFixed(digits),
      CI: (x0,x1) => x0.vibrate(x1),
      CJ: x0 => x0.close(),
      CK: (x0,x1) => { x0.min = x1 },
      CL: x0 => x0.location,
      CM: (x0,x1) => { x0.exposureMode = x1 },
      CN: x0 => x0.play(),
      CO: x0 => x0.type,
      CP: (x0,x1) => ({next: x0,error: x1}),
      CQ: () => globalThis._flutter,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.v8BreakIterator,
      DH: x0 => x0.maxHeight,
      DI: x0 => x0.content,
      DJ: (x0,x1) => x0.send(x1),
      DK: (x0,x1) => { x0.max = x1 },
      DL: (x0,x1) => x0.getModifierState(x1),
      DM: x0 => x0.exposureMode,
      DN: x0 => x0.paused,
      DO: x0 => x0.lastModified,
      DP: (x0,x1) => globalThis.firebase_messaging.onMessage(x0,x1),
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
      EH: x0 => x0.maxWidth,
      EI: x0 => x0.document,
      EJ: x0 => x0.readyState,
      EK: (x0,x1) => { x0.disabled = x1 },
      EL: x0 => x0.metaKey,
      EM: (x0,x1) => { x0.focusMode = x1 },
      EN: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      EO: x0 => x0.name,
      EP: x0 => globalThis.firebase_messaging.getMessaging(x0),
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: (x0,x1) => x0.segment(x1),
      FH: x0 => x0.minHeight,
      FI: (x0,x1) => x0.revokeObjectURL(x1),
      FJ: (x0,x1) => { x0.binaryType = x1 },
      FK: (x0,x1) => { x0.scrollLeft = x1 },
      FL: x0 => x0.altKey,
      FM: x0 => x0.focusMode,
      FN: (x0,x1,x2,x3,x4) => x0.getImageData(x1,x2,x3,x4),
      FO: (x0,x1) => x0.item(x1),
      FP: x0 => globalThis.firebase_core.getApp(x0),
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.index,
      GH: x0 => x0.minWidth,
      GI: (x0,x1) => { x0.src = x1 },
      GJ: (a, l) => a.length = l,
      GK: (x0,x1) => { x0.spellcheck = x1 },
      GL: x0 => x0.ctrlKey,
      GM: x0 => x0.enumerateDevices(),
      GN: (x0,x1,x2) => x0.readBarcodes(x1,x2),
      GO: x0 => x0.length,
      GP: () => globalThis.firebase_core.getApp(),
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
      HH: (x0,x1) => x0.removeProperty(x1),
      HI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      HJ: () => new FileReader(),
      HK: (x0,x1) => { x0.disabled = x1 },
      HL: x0 => x0.isComposing,
      HM: x0 => x0.deviceId,
      HN: x0 => x0.text,
      HO: x0 => x0.files,
      HP: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.value,
      IH: (x0,x1) => x0.add(x1),
      II: x0 => x0.naturalHeight,
      IJ: (x0,x1) => x0.readAsArrayBuffer(x1),
      IK: (x0,x1) => x0.getItem(x1),
      IL: x0 => x0.code,
      IM: x0 => x0.kind,
      IN: x0 => x0.format,
      IO: x0 => x0.target,
      IP: x0 => x0.sessionStorage,
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
      JH: x0 => x0.data,
      JI: x0 => x0.naturalWidth,
      JJ: x0 => x0.result,
      JK: x0 => x0.localStorage,
      JL: x0 => x0.repeat,
      JM: x0 => x0.mediaDevices,
      JN: x0 => x0.bytes,
      JO: (x0,x1) => x0.replaceChildren(x1),
      JP: x0 => x0.measurementId,
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
      KH: (x0,x1) => { x0.scrollTop = x1 },
      KI: x0 => x0.decode(),
      KJ: () => new XMLHttpRequest(),
      KK: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      KL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KM: x0 => x0.facingMode,
      KN: x0 => x0.y,
      KO: x0 => x0.click(),
      KP: x0 => x0.appId,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: x0 => x0.iterator,
      LH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      LI: (x0,x1) => { x0.decoding = x1 },
      LJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      LK: x0 => x0.history,
      LL: x0 => x0.userAgent,
      LM: x0 => x0.mediaDevices,
      LN: x0 => x0.x,
      LO: (x0,x1,x2) => x0.setAttribute(x1,x2),
      LP: x0 => x0.messagingSenderId,
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: () => globalThis.Symbol,
      MH: (x0,x1) => { x0.value = x1 },
      MI: (x0,x1) => { x0.crossOrigin = x1 },
      MJ: x0 => x0.send(),
      MK: x0 => x0.href,
      ML: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      MM: () => globalThis.BarcodeDetector.getSupportedFormats(),
      MN: x0 => x0.bottomLeft,
      MO: (x0,x1) => { x0.accept = x1 },
      MP: x0 => x0.authDomain,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: (x0,x1) => new Intl.Segmenter(x0,x1),
      NH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      NI: (x0,x1) => x0.createObjectURL(x1),
      NJ: x0 => x0.type,
      NK: x0 => x0.location,
      NL: (x0,x1) => x0.key(x1),
      NM: (x0,x1) => x0.call(x1),
      NN: x0 => x0.bottomRight,
      NO: (x0,x1) => { x0.multiple = x1 },
      NP: x0 => x0.projectId,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: x0 => x0.Segmenter,
      OH: (x0,x1) => { x0.value = x1 },
      OI: x0 => x0.URL,
      OJ: x0 => x0.response,
      OK: (x0,x1) => x0.removeItem(x1),
      OL: x0 => x0.length,
      OM: x0 => x0.reset,
      ON: x0 => x0.topRight,
      OO: (x0,x1) => { x0.type = x1 },
      OP: x0 => x0.name,
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
      PH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      PI: x0 => new Blob(x0),
      PJ: (x0,x1) => { x0.responseType = x1 },
      PK: (x0,x1,x2) => x0.setItem(x1,x2),
      PL: (x0,x1) => x0.canShare(x1),
      PM: x0 => x0.stopContinuousDecode,
      PN: x0 => x0.topLeft,
      PO: (x0,x1) => x0.getAttribute(x1),
      PP: x0 => x0.name,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: x0 => x0.wasmMemory,
      QH: x0 => x0.value,
      QI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      QJ: x0 => x0.vendor,
      QK: x0 => new BroadcastChannel(x0),
      QL: (x0,x1) => x0.share(x1),
      QM: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QN: x0 => x0.position,
      QO: (x0,x1) => x0.debug(x1),
      QP: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: () => globalThis.window._flutter_skwasmInstance,
      RH: x0 => x0.selectionDirection,
      RI: x0 => new window.ImageDecoder(x0),
      RJ: x0 => x0.navigator,
      RK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      RL: x0 => x0.message,
      RM: (x0,x1,x2,x3) => x0.call(x1,x2,x3),
      RN: x0 => x0.isValid,
      RO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      RP: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: () => new TextDecoder(),
      SH: x0 => x0.selectionStart,
      SI: x0 => x0.name,
      SJ: () => globalThis.window,
      SK: x0 => x0.close(),
      SL: (x0,x1) => ({files: x0,text: x1}),
      SM: x0 => x0.text,
      SN: (x0,x1,x2,x3) => ({formats: x0,tryHarder: x1,tryRotate: x2,tryInvert: x3}),
      SO: x0 => ({createScriptURL: x0}),
      SP: x0 => globalThis.firebase_core.initializeApp(x0),
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: (x0,x1) => x0.getRandomValues(x1),
      TH: x0 => x0.selectionEnd,
      TI: x0 => x0.repetitionCount,
      TJ: x0 => new Blob(x0),
      TK: (x0,x1) => x0.postMessage(x1),
      TL: x0 => ({files: x0}),
      TM: x0 => x0.barcodeFormat,
      TN: (x0,x1,x2) => ({tryHarder: x0,tryRotate: x1,tryInvert: x2}),
      TO: (x0,x1,x2) => x0.createPolicy(x1,x2),
      TP: x0 => x0.storageBucket,
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
      UH: x0 => x0.value,
      UI: x0 => x0.frameCount,
      UJ: x0 => globalThis.fetch(x0),
      UK: (x0,x1) => { x0.onmessage = x1 },
      UL: x0 => ({text: x0}),
      UM: x0 => x0.rawBytes,
      UN: () => globalThis.ZXingWASM,
      UO: (x0,x1) => x0.createScriptURL(x1),
      UP: x0 => x0.databaseURL,
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
      VH: x0 => x0.selectionDirection,
      VI: x0 => x0.selectedTrack,
      VJ: x0 => x0.arrayBuffer(),
      VK: () => new AbortController(),
      VL: x0 => x0.getTracks(),
      VM: x0 => x0.y,
      VN: (x0,x1) => { x0.height = x1 },
      VO: (x0,x1) => { x0.nonce = x1 },
      VP: x0 => x0.apiKey,
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
      WH: x0 => x0.selectionStart,
      WI: x0 => x0.completed,
      WJ: (x0,x1) => x0.createElement(x1),
      WK: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      WL: x0 => x0.stop(),
      WM: x0 => x0.x,
      WN: (x0,x1) => { x0.width = x1 },
      WO: (x0,x1) => x0.querySelectorAll(x1),
      WP: x0 => x0.options,
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
      XH: x0 => x0.selectionEnd,
      XI: x0 => x0.ready,
      XJ: (x0,x1) => x0.append(x1),
      XK: (x0,x1) => globalThis.fetch(x0,x1),
      XL: (x0,x1) => { x0.transform = x1 },
      XM: x0 => x0.resultPoints,
      XN: x0 => x0.height,
      XO: (x0,x1) => x0.item(x1),
      XP: () => globalThis.firebase_core.SDK_VERSION,
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: (map, o, v) => map.set(o, v),
      YH: x0 => x0.keyCode,
      YI: x0 => x0.tracks,
      YJ: (x0,x1,x2) => x0.insertRule(x1,x2),
      YK: (x0,x1) => x0.get(x1),
      YL: x0 => x0.style,
      YM: x0 => x0.message,
      YN: x0 => x0.width,
      YO: x0 => x0.nonce,
      YP: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: (map, o) => map.get(o),
      ZH: (x0,x1) => x0.scrollIntoView(x1),
      ZI: x0 => x0.close(),
      ZJ: (x0,x1) => x0.add(x1),
      ZK: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      ZL: x0 => x0.getVideoTracks(),
      ZM: x0 => x0.videoElement,
      ZN: (x0,x1) => { x0.srcObject = x1 },
      ZO: x0 => x0.length,
      ZP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: () => new WeakMap(),
      aH: x0 => x0.multiViewEnabled,
      aI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      aJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aK: (x0,x1) => x0.forEach(x1),
      aL: x0 => x0.getSettings(),
      aM: x0 => x0.decodeContinuously,
      aN: x0 => ({willReadFrequently: x0}),
      aO: x0 => x0.document,
      aP: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
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
      bH: (x0,x1) => x0.replaceWith(x1),
      bI: (x0,x1) => x0.decode(x1),
      bJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      bK: x0 => x0.name,
      bL: x0 => x0.facingMode,
      bM: (x0,x1) => new ZXing.BrowserMultiFormatReader(x0,x1),
      bN: (x0,x1,x2) => x0.getContext(x1,x2),
      bO: (x0,x1) => { x0.src = x1 },
      bP: (x0,x1) => x0.createScriptURL(x1),
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: x0 => x0.status,
      cH: (x0,x1) => { x0.type = x1 },
      cI: x0 => x0.displayHeight,
      cJ: x0 => x0.preventDefault(),
      cK: x0 => x0.statusText,
      cL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cM: (x0,x1) => ({width: x0,height: x1}),
      cN: () => new BarcodeDetector(),
      cO: x0 => x0.trustedTypes,
      cP: (x0,x1,x2) => x0.createScript(x1,x2),
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
      dH: (x0,x1) => { x0.className = x1 },
      dI: x0 => x0.displayWidth,
      dJ: x0 => x0.createRange(),
      dK: x0 => x0.url,
      dL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      dM: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      dN: x0 => ({formats: x0}),
      dO: () => globalThis.console,
      dP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: x0 => x0.arrayBuffer(),
      eH: (x0,x1) => { x0.tabIndex = x1 },
      eI: x0 => x0.duration,
      eJ: (x0,x1) => x0.selectNode(x1),
      eK: x0 => x0.status,
      eL: (x0,x1) => x0.append(x1),
      eM: x0 => x0.facingMode,
      eN: x0 => new BarcodeDetector(x0),
      eO: x0 => x0.trustedTypes,
      eP: (o, p) => delete o[p],
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
      fH: (x0,x1) => { x0.name = x1 },
      fI: x0 => x0.image,
      fJ: x0 => x0.getSelection(),
      fK: x0 => x0.getReader(),
      fL: (x0,x1) => x0.createElement(x1),
      fM: x0 => x0.height,
      fN: (x0,x1) => x0.detect(x1),
      fO: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      fP: (o, p, v) => o[p] = v,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: (x0,x1) => x0.fetch(x1),
      gH: (x0,x1) => { x0.placeholder = x1 },
      gI: () => globalThis.window.ImageDecoder,
      gJ: x0 => x0.removeAllRanges(),
      gK: x0 => x0.read(),
      gL: () => globalThis.document,
      gM: x0 => x0.width,
      gN: x0 => x0.rawValue,
      gO: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      gP: (x0,x1) => { x0.text = x1 },
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: x0 => x0.fontFallbackBaseUrl,
      hH: (x0,x1) => { x0.autocomplete = x1 },
      hI: (o, p) => p in o,
      hJ: (x0,x1) => x0.addRange(x1),
      hK: x0 => x0.value,
      hL: (x0,x1) => { x0.onpause = x1 },
      hM: x0 => x0.attachStreamToVideo,
      hN: x0 => x0.format,
      hO: () => globalThis.removeSplashFromWeb(),
      hP: (x0,x1) => { x0.text = x1 },
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: (handle) => clearInterval(handle),
      iH: (x0,x1) => { x0.name = x1 },
      iI: x0 => x0.groups,
      iJ: () => globalThis.window,
      iK: x0 => x0.done,
      iL: (x0,x1) => { x0.onplay = x1 },
      iM: () => new Map(),
      iN: x0 => x0.y,
      iO: x0 => x0.message,
      iP: x0 => x0.trustedTypes,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      jH: (x0,x1) => { x0.placeholder = x1 },
      jI: x0 => new WeakRef(x0),
      jJ: (x0,x1) => { x0.innerText = x1 },
      jK: x0 => x0.cancel(),
      jL: (x0,x1) => { x0.controls = x1 },
      jM: (x0,x1,x2) => x0.set(x1,x2),
      jN: x0 => x0.x,
      jO: x0 => x0.code,
      jP: (x0,x1,x2) => x0.addEventListener(x1,x2),
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: () => Date.now(),
      kH: (x0,x1) => { x0.action = x1 },
      kI: x0 => x0.deref(),
      kJ: x0 => x0.offsetY,
      kK: x0 => x0.body,
      kL: (x0,x1) => { x0.pointerEvents = x1 },
      kM: (x0,x1) => x0.querySelector(x1),
      kN: x0 => x0.cornerPoints,
      kO: () => globalThis.Notification.requestPermission(),
      kP: x0 => x0.firstChild,
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
      lH: (x0,x1) => { x0.method = x1 },
      lI: () => globalThis.WeakRef,
      lJ: x0 => x0.offsetX,
      lK: x0 => x0.headers,
      lL: (x0,x1) => { x0.transformOrigin = x1 },
      lM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      lN: x0 => x0.body,
      lO: (x0,x1) => x0.register(x1),
      lP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
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
      mH: (x0,x1) => { x0.noValidate = x1 },
      mI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      mJ: x0 => x0.button,
      mK: x0 => x0.signal,
      mL: (x0,x1) => { x0.objectFit = x1 },
      mM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mN: x0 => globalThis.URL.revokeObjectURL(x0),
      mO: (x0,x1) => ({vapidKey: x0,serviceWorkerRegistration: x1}),
      mP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
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
      nH: (x0,x1) => x0.removeAttribute(x1),
      nI: (a, s, e) => a.slice(s, e),
      nJ: x0 => x0.classList,
      nK: x0 => x0.abort(),
      nL: (x0,x1) => { x0.width = x1 },
      nM: (x0,x1) => x0.appendChild(x1),
      nN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      nO: (x0,x1) => globalThis.firebase_messaging.getToken(x0,x1),
      nP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
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
      oH: x0 => x0.isConnected,
      oI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      oJ: (x0,x1) => { x0.height = x1 },
      oK: (x0,x1) => x0.transferFromImageBitmap(x1),
      oL: (x0,x1) => { x0.height = x1 },
      oM: x0 => x0.head,
      oN: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      oO: x0 => x0.serviceWorker,
      oP: x0 => x0.parentNode,
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
      pH: x0 => x0.click(),
      pI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      pJ: (x0,x1) => { x0.width = x1 },
      pK: (x0,x1) => x0.getContext(x1),
      pL: x0 => x0.getSupportedConstraints(),
      pM: (x0,x1) => { x0.onerror = x1 },
      pN: x0 => globalThis.URL.createObjectURL(x0),
      pO: x0 => x0.link,
      pP: (x0,x1,x2) => x0.removeEventListener(x1,x2),
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
      qH: (x0,x1) => x0.getElementsByClassName(x1),
      qI: () => new Array(),
      qJ: x0 => x0.style,
      qK: (x0,x1) => { x0.height = x1 },
      qL: x0 => ({ideal: x0}),
      qM: (x0,x1) => x0.removeChild(x1),
      qN: x0 => x0.size,
      qO: x0 => x0.analyticsLabel,
      qP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: (x0,x1) => x0.requestAnimationFrame(x1),
      rG: o => Object.keys(o),
      rH: (x0,x1) => x0.dispatchEvent(x1),
      rI: (x0,x1) => new WebSocket(x0,x1),
      rJ: x0 => x0.sheet,
      rK: (x0,x1) => { x0.width = x1 },
      rL: (x0,x1,x2) => ({width: x0,height: x1,deviceId: x2}),
      rM: (x0,x1) => { x0.onload = x1 },
      rN: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      rO: x0 => x0.image,
      rP: (x0,x1) => { x0.display = x1 },
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sG: x0 => x0.state,
      sH: (x0,x1) => x0.createEvent(x1),
      sI: x0 => x0.reason,
      sJ: x0 => x0.head,
      sK: x0 => x0.height,
      sL: x0 => ({video: x0}),
      sM: (x0,x1) => { x0.src = x1 },
      sN: (x0,x1) => x0.getContext(x1),
      sO: x0 => x0.body,
      sP: (x0,x1) => { x0.draggable = x1 },
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
      tH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      tI: x0 => x0.code,
      tJ: () => globalThis.document,
      tK: x0 => x0.width,
      tL: (x0,x1) => ({width: x0,height: x1}),
      tM: (x0,x1) => { x0.crossOrigin = x1 },
      tN: x0 => x0.height,
      tO: x0 => x0.title,
      tP: x0 => x0.length,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: x0 => x0.performance,
      uG: (x0,x1) => x0.go(x1),
      uH: x0 => x0.readText(),
      uI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      uJ: Function.prototype.call.bind(DataView.prototype.getBigUint64),
      uK: x0 => x0.rasterEndMilliseconds,
      uL: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      uM: (x0,x1) => { x0.lang = x1 },
      uN: x0 => x0.width,
      uO: x0 => x0.fcmOptions,
      uP: x0 => x0.getReader(),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: x0 => new Uint8Array(x0),
      vG: x0 => x0.hash,
      vH: x0 => x0.clipboard,
      vI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      vJ: o => o.byteLength,
      vK: x0 => x0.rasterStartMilliseconds,
      vL: (x0,x1) => x0.getUserMedia(x1),
      vM: (x0,x1) => { x0.type = x1 },
      vN: x0 => x0.remove(),
      vO: x0 => x0.notification,
      vP: x0 => x0.value,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: (x0,x1,x2) => x0.slice(x1,x2),
      wG: x0 => x0.location,
      wH: (x0,x1) => x0.writeText(x1),
      wI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      wJ: (x0,x1,x2) => x0.insertBefore(x1,x2),
      wK: x0 => x0.imageBitmaps,
      wL: x0 => x0.deviceId,
      wM: (x0,x1) => { x0.defer = x1 },
      wN: (x0,x1) => { x0.src = x1 },
      wO: x0 => x0.messageId,
      wP: x0 => x0.done,
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
      xH: x0 => x0.unlock(),
      xI: (o, t) => typeof o === t,
      xJ: x0 => x0.id,
      xK: x0 => x0.canvasKitMaximumSurfaces,
      xL: x0 => x0.getCapabilities(),
      xM: (x0,x1) => { x0.async = x1 },
      xN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xO: x0 => x0.from,
      xP: x0 => x0.read(),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: (x0,x1) => x0.adoptText(x1),
      yG: x0 => x0.pathname,
      yH: (x0,x1) => x0.lock(x1),
      yI: x0 => x0.data,
      yJ: x0 => x0.offsetHeight,
      yK: x0 => x0.nextSibling,
      yL: () => ({}),
      yM: (x0,x1) => { x0.id = x1 },
      yN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      yO: x0 => x0.collapseKey,
      yP: x0 => x0.body,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: x0 => x0.first(),
      zG: (a, l) => a.length = l,
      zH: x0 => x0.orientation,
      zI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      zJ: x0 => x0.offsetWidth,
      zK: (x0,x1) => x0.debug(x1),
      zL: (x0,x1) => x0.applyConstraints(x1),
      zM: x0 => x0.videoHeight,
      zN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      zO: x0 => x0.data,
      zP: (x0,x1) => new OffscreenCanvas(x0,x1),

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
