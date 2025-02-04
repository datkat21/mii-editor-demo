var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// src/lib/struct-fu/lib.js
var require_lib = __commonJS((exports, module) => {
  var _ = {};
  if (!("bind" in Function.prototype)) {
    Function.prototype.bind = function(owner) {
      var that = this;
      if (arguments.length <= 1) {
        return function() {
          return that.apply(owner, arguments);
        };
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
          return that.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
        };
      }
    };
  }
  function newBuffer(size) {
    return new Uint8Array(new ArrayBuffer(size));
  }
  function extend(obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(ext) {
      Object.keys(ext).forEach(function(key) {
        obj[key] = ext[key];
      });
    });
    return obj;
  }
  function addField(ctr, f) {
    if ("width" in f) {
      ctr.bits = (ctr.bits || 0) + f.width;
      while (ctr.bits > 7) {
        ctr.bytes += 1;
        ctr.bits -= 8;
      }
    } else if (!ctr.bits) {
      ctr.bytes += f.size;
    } else {
      throw Error("Improperly aligned bitfield before field: " + f.name);
    }
    return ctr;
  }
  function arrayizeField(f, count) {
    var f2 = typeof count === "number" ? extend({
      name: f.name,
      field: f,
      valueFromBytes: function(buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var arr = new Array(count);
        for (var idx = 0, len = arr.length;idx < len; idx += 1) {
          arr[idx] = f.valueFromBytes(buf, off);
        }
        return arr;
      },
      bytesFromValue: function(arr, buf, off) {
        arr || (arr = new Array(count));
        buf || (buf = newBuffer(this.size));
        off || (off = { bytes: 0, bits: 0 });
        for (var idx = 0, len = Math.min(arr.length, count);idx < len; idx += 1) {
          f.bytesFromValue(arr[idx], buf, off);
        }
        while (idx++ < count)
          addField(off, f);
        return buf;
      }
    }, "width" in f ? { width: f.width * count } : { size: f.size * count }) : f;
    f2.pack = f2.bytesFromValue;
    f2.unpack = f2.valueFromBytes;
    return f2;
  }
  _.struct = function(name, fields, count) {
    if (typeof name !== "string") {
      count = fields;
      fields = name;
      name = null;
    }
    var _size = { bytes: 0, bits: 0 }, _padsById = Object.create(null), fieldsObj = fields.reduce(function(obj, f) {
      if ("_padTo" in f) {
        f._id || (f._id = "id" + Math.random().toFixed(20).slice(2));
        var _f = _padsById[f._id] = _size.bits ? {
          width: 8 * (f._padTo - _size.bytes) - _size.bits
        } : {
          size: f._padTo - _size.bytes
        };
        if (_f.width !== undefined && _f.width < 0 || _f.size !== undefined && _f.size < 0) {
          var xtraMsg = _size.bits ? " and " + _size.bits + " bits" : "";
          throw Error("Invalid .padTo(" + f._padTo + ") field, struct is already " + _size.bytes + " byte(s)" + xtraMsg + "!");
        }
        f = _f;
      } else if (f._hoistFields) {
        Object.keys(f._hoistFields).forEach(function(name2) {
          var _f2 = Object.create(f._hoistFields[name2]);
          if ("width" in _f2) {
            _f2.offset = { bytes: _f2.offset.bytes + _size.bytes, bits: _f2.offset.bits };
          } else {
            _f2.offset += _size.bytes;
          }
          obj[name2] = _f2;
        });
      } else if (f.name) {
        f = Object.create(f);
        f.offset = "width" in f ? { bytes: _size.bytes, bits: _size.bits } : _size.bytes, obj[f.name] = f;
      }
      addField(_size, f);
      return obj;
    }, {});
    if (_size.bits)
      throw Error("Improperly aligned bitfield at end of struct: " + name);
    return arrayizeField({
      valueFromBytes: function(buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var obj = {};
        fields.forEach(function(f) {
          if ("_padTo" in f)
            return addField(off, _padsById[f._id]);
          var value = f.valueFromBytes(buf, off);
          if (f.name)
            obj[f.name] = value;
          else if (typeof value === "object")
            extend(obj, value);
        });
        return obj;
      },
      bytesFromValue: function(obj, buf, off) {
        obj || (obj = {});
        buf || (buf = newBuffer(this.size));
        off || (off = { bytes: 0, bits: 0 });
        fields.forEach(function(f) {
          if ("_padTo" in f)
            return addField(off, _padsById[f._id]);
          var value = f.name ? obj[f.name] : obj;
          f.bytesFromValue(value, buf, off);
        });
        return buf;
      },
      _hoistFields: !name ? fieldsObj : null,
      fields: fieldsObj,
      size: _size.bytes,
      name
    }, count);
  };
  function truncatedReadUInt32(buffer, offset, littleEndian) {
    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    var availableBytes = bytes.length - offset;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (availableBytes >= 4) {
      return view.getUint32(offset, littleEndian);
    } else if (availableBytes === 3) {
      var first = view.getUint16(offset, littleEndian);
      var second = view.getUint8(offset + 2);
      return littleEndian ? (second << 16) + first >>> 0 : (first << 8) + second << 8 >>> 0;
    } else if (availableBytes === 2) {
      return view.getUint16(offset, littleEndian) << (littleEndian ? 0 : 16) >>> 0;
    } else if (availableBytes === 1) {
      return view.getUint8(offset) << (littleEndian ? 0 : 24) >>> 0;
    } else {
      return 0;
    }
  }
  function truncatedWriteUInt32(buffer, offset, data, littleEndian) {
    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    var availableBytes = bytes.length - offset;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (availableBytes >= 4) {
      view.setUint32(offset, data, littleEndian);
    } else if (availableBytes === 3) {
      if (littleEndian) {
        view.setUint8(offset, data & 255);
        view.setUint16(offset + 1, data >>> 8, littleEndian);
      } else {
        view.setUint16(offset, data >>> 16, littleEndian);
        view.setUint8(offset + 2, data >>> 8 & 255);
      }
    } else if (availableBytes === 2) {
      view.setUint16(offset, littleEndian ? data & 65535 : data >>> 16, littleEndian);
    } else if (availableBytes === 1) {
      view.setUint8(offset, littleEndian ? data & 255 : data >>> 24);
    }
  }
  _.padTo = function(off) {
    return { _padTo: off };
  };
  var FULL = 4294967295;
  function bitfield(name, width, count) {
    var littleEndian = false;
    width || (width = 1);
    if (width > 24)
      throw Error("Bitfields support a maximum width of 24 bits.");
    var impl = this, mask = FULL >>> 32 - width;
    return arrayizeField({
      valueFromBytes: function(buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var end = (off.bits || 0) + width, word = truncatedReadUInt32(buf, off.bytes, littleEndian) || 0, over = word >>> 32 - end;
        addField(off, this);
        return impl.b2v.call(this, over & mask);
      },
      bytesFromValue: function(val, buf, off) {
        val = impl.v2b.call(this, val || 0);
        off || (off = { bytes: 0, bits: 0 });
        var end = (off.bits || 0) + width, word = truncatedReadUInt32(buf, off.bytes, littleEndian) || 0, zero = mask << 32 - end, over = (val & mask) << 32 - end;
        word &= ~zero;
        word |= over;
        word >>>= 0;
        truncatedWriteUInt32(buf, off.bytes, word, littleEndian);
        addField(off, this);
        return buf;
      },
      width,
      name
    }, count);
  }
  function bitfieldLE(name, width, count) {
    width || (width = 1);
    if (width > 24)
      throw Error("Bitfields support a maximum width of 24 bits.");
    var impl = this, mask = 4294967295 >>> 32 - width >>> 0;
    return arrayizeField({
      valueFromBytes: function(buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var word = truncatedReadUInt32(buf, off.bytes, true) >>> 0;
        var shift = off.bits;
        var result = word >>> shift & mask;
        addField(off, this);
        return impl.b2v.call(this, result);
      },
      bytesFromValue: function(val, buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var word = truncatedReadUInt32(buf, off.bytes, true) >>> 0;
        var shift = off.bits;
        var clearMask = ~(mask << shift) >>> 0;
        word &= clearMask;
        var toStore = (impl.v2b.call(this, val) & mask) << shift;
        word |= toStore >>> 0;
        truncatedWriteUInt32(buf, off.bytes, word >>> 0, true);
        addField(off, this);
        return buf;
      },
      width,
      name
    }, count);
  }
  _.bool = function(name, count) {
    return bitfield.call({
      b2v: function(b) {
        return Boolean(b);
      },
      v2b: function(v) {
        return v ? FULL : 0;
      }
    }, name, 1, count);
  };
  _.ubit = bitfield.bind({
    b2v: function(b) {
      return b;
    },
    v2b: function(v) {
      return v;
    }
  });
  _.ubitLE = bitfieldLE.bind({
    b2v: function(b) {
      return b;
    },
    v2b: function(v) {
      return v;
    }
  });
  _.sbit = bitfield.bind({
    b2v: function(b) {
      var m = 1 << this.width - 1, s = b & m;
      return s ? -(b &= ~m) : b;
    },
    v2b: function(v) {
      var m = 1 << this.width - 1, s = v < 0;
      return s ? -v | m : v;
    }
  });
  function bytefield(name, size, count) {
    if (typeof name !== "string") {
      count = size;
      size = name;
      name = null;
    }
    size = typeof size === "number" ? size : 1;
    var impl = this;
    return arrayizeField({
      valueFromBytes: function(buf, off) {
        off || (off = { bytes: 0, bits: 0 });
        var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
        var val = bytes.subarray(off.bytes, off.bytes + this.size);
        addField(off, this);
        return impl.b2v.call(this, val);
      },
      bytesFromValue: function(val, buf, off) {
        buf || (buf = newBuffer(this.size));
        off || (off = { bytes: 0, bits: 0 });
        var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
        var blk = bytes.subarray(off.bytes, off.bytes + this.size);
        impl.vTb.call(this, val, blk);
        addField(off, this);
        return buf;
      },
      size,
      name
    }, count);
  }
  function swapBytesPairs(fromBuffer, toBuffer) {
    toBuffer = toBuffer || fromBuffer;
    var l = fromBuffer.length;
    for (var i = 1;i < l; i += 2) {
      var a = fromBuffer[i - 1];
      toBuffer[i - 1] = fromBuffer[i];
      toBuffer[i] = a;
    }
    return toBuffer;
  }
  _.byte = bytefield.bind({
    b2v: function(b) {
      return b;
    },
    vTb: function(v, b) {
      if (!v)
        return 0;
      b.set(new Uint8Array(v));
      return v.byteLength;
    }
  });
  _.char = bytefield.bind({
    b2v: function(b) {
      var decoder;
      if (typeof TextDecoder !== "undefined") {
        decoder = new TextDecoder("utf-8");
      } else {
        var TextDecoder = function() {
        };
        TextDecoder.prototype.decode = function(buffer) {
          var bytes = new Uint8Array(buffer);
          var str = "";
          for (var i = 0;i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
          }
          return str;
        };
        decoder = new TextDecoder;
      }
      var v = decoder.decode(b);
      var z = v.indexOf("\x00");
      return ~z ? v.slice(0, z) : v;
    },
    vTb: function(v, b) {
      v || (v = "");
      var encoder;
      if (typeof TextEncoder !== "undefined") {
        encoder = new TextEncoder("utf-8");
      } else {
        var TextEncoder = function() {
        };
        TextEncoder.prototype.encode = function(str) {
          var bytes = new Uint8Array(str.length);
          for (var i2 = 0;i2 < str.length; i2++) {
            bytes[i2] = str.charCodeAt(i2);
          }
          return bytes;
        };
        encoder = new TextEncoder;
      }
      var encoded = encoder.encode(v);
      for (var i = 0;i < encoded.length && i < b.length; i++) {
        b[i] = encoded[i];
      }
      return encoded.length;
    }
  });
  _.char16le = bytefield.bind({
    b2v: function(b) {
      var decoder;
      if (typeof TextDecoder !== "undefined") {
        decoder = new TextDecoder("utf-16le");
      } else {
        var TextDecoder = function() {
        };
        TextDecoder.prototype.decode = function(buffer) {
          var bytes = new Uint8Array(buffer);
          var str = "";
          for (var i = 0;i < bytes.length; i += 2) {
            var charCode = bytes[i] | bytes[i + 1] << 8;
            str += String.fromCharCode(charCode);
          }
          return str;
        };
        decoder = new TextDecoder;
      }
      var v = decoder.decode(b);
      var z = v.indexOf("\x00");
      return ~z ? v.slice(0, z) : v;
    },
    vTb: function(v, b) {
      v || (v = "");
      var bytesWritten = 0;
      for (var i = 0;i < v.length && bytesWritten + 1 < b.length; i++) {
        var charCode = v.charCodeAt(i);
        b[bytesWritten++] = charCode & 255;
        b[bytesWritten++] = charCode >> 8 & 255;
      }
      return bytesWritten;
    }
  });
  _.char16be = bytefield.bind({
    b2v: function(b) {
      var temp = new Uint8Array(b);
      swapBytesPairs(temp);
      var decoder;
      if (typeof TextDecoder !== "undefined") {
        decoder = new TextDecoder("utf-16le");
      } else {
        var TextDecoder = function() {
        };
        TextDecoder.prototype.decode = function(buffer) {
          var bytes = new Uint8Array(buffer);
          var str = "";
          for (var i = 0;i < bytes.length; i += 2) {
            var charCode = bytes[i] | bytes[i + 1] << 8;
            str += String.fromCharCode(charCode);
          }
          return str;
        };
        decoder = new TextDecoder;
      }
      var v = decoder.decode(temp.buffer);
      var z = v.indexOf("\x00");
      return ~z ? v.slice(0, z) : v;
    },
    vTb: function(v, b) {
      v || (v = "");
      var temp = new Uint8Array(b.length);
      var bytesWritten = 0;
      for (var i = 0;i < v.length && bytesWritten + 1 < temp.length; i++) {
        var charCode = v.charCodeAt(i);
        temp[bytesWritten++] = charCode & 255;
        temp[bytesWritten++] = charCode >> 8 & 255;
      }
      swapBytesPairs(temp, b);
      return bytesWritten;
    }
  });
  function standardField(sig, size, littleEndian) {
    var read = "get" + sig, dump = "set" + sig;
    size || (size = +sig.match(/\d+/)[0] / 8);
    return function(name, count) {
      if (typeof name !== "string") {
        count = name;
        name = null;
      }
      return arrayizeField({
        valueFromBytes: function(buf, off) {
          off || (off = { bytes: 0 });
          var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
          var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          var val = view[read](off.bytes, littleEndian);
          addField(off, this);
          return val;
        },
        bytesFromValue: function(val, buf, off) {
          val || (val = 0);
          buf || (buf = newBuffer(this.size));
          off || (off = { bytes: 0 });
          var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
          var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          view[dump](off.bytes, val, littleEndian);
          addField(off, this);
          return buf;
        },
        size,
        name
      }, count);
    };
  }
  _.uint8 = standardField("Uint8", 1, false);
  _.uint16 = standardField("Uint16", 2, false);
  _.uint32 = standardField("Uint32", 4, false);
  _.uint16le = standardField("Uint16", 2, true);
  _.uint32le = standardField("Uint32", 4, true);
  _.int8 = standardField("Int8", 1, false);
  _.int16 = standardField("Int16", 2, false);
  _.int32 = standardField("Int32", 4, false);
  _.int16le = standardField("Int16", 2, true);
  _.int32le = standardField("Int32", 4, true);
  _.float32 = standardField("Float32", 4, false);
  _.float64 = standardField("Float64", 8, false);
  _.float32le = standardField("Float32", 4, true);
  _.float64le = standardField("Float64", 8, true);
  _.derive = function(orig, pack, unpack) {
    return function(name, count) {
      if (typeof name !== "string") {
        count = name;
        name = null;
      }
      return arrayizeField(extend({
        valueFromBytes: function(buf, off) {
          return unpack(orig.valueFromBytes(buf, off));
        },
        bytesFromValue: function(val, buf, off) {
          return orig.bytesFromValue(pack(val), buf, off);
        },
        name
      }, "width" in orig ? { width: orig.width } : { size: orig.size }), count);
    };
  };
  if (typeof module !== "undefined" && module.exports) {
    console.log("module scope");
    module.exports = _;
  } else {
    console.log("not module scope");
    window._ = _;
  }
});

// node_modules/@datkat21/html/dist/html.js
/*!
Html library by datkat21 on GitHub. Licensed under MIT
https://github.com/datkat21/html
!*/

class Html {
  elm;
  constructor(elm) {
    if (elm instanceof HTMLElement)
      this.elm = elm;
    else
      this.elm = document.createElement(elm || "div");
  }
  text(val) {
    this.elm.innerText = val;
    return this;
  }
  html(val) {
    this.elm.innerHTML = val;
    return this;
  }
  cleanup() {
    this.elm.remove();
    return this;
  }
  query(selector) {
    return this.elm.querySelector(selector);
  }
  qs(query) {
    if (this.elm.querySelector(query))
      return Html.from(this.elm.querySelector(query));
    else
      return null;
  }
  qsa(query) {
    if (this.elm.querySelector(query))
      return Array.from(this.elm.querySelectorAll(query)).map((e) => Html.from(e));
    else
      return null;
  }
  id(val) {
    this.elm.id = val;
    return this;
  }
  class(...val) {
    for (let i = 0;i < val.length; i++)
      this.elm.classList.toggle(val[i]);
    return this;
  }
  classOn(...val) {
    for (let i = 0;i < val.length; i++)
      this.elm.classList.add(val[i]);
    return this;
  }
  classOff(...val) {
    for (let i = 0;i < val.length; i++)
      this.elm.classList.remove(val[i]);
    return this;
  }
  style(obj) {
    for (const key of Object.keys(obj))
      this.elm.style.setProperty(key, obj[key]);
    return this;
  }
  styleJs(obj) {
    for (const key of Object.keys(obj))
      this.elm.style[key] = obj[key];
    return this;
  }
  on(ev, cb) {
    this.elm.addEventListener(ev, cb);
    return this;
  }
  un(ev, cb) {
    this.elm.removeEventListener(ev, cb);
    return this;
  }
  getElement(element) {
    let p = element instanceof Html ? element.elm : element;
    if (typeof element === "string")
      p = document.querySelector(element);
    if (p instanceof HTMLElement)
      return p;
    else
      throw new Error("Invalid element type.");
  }
  appendTo(parent) {
    let p = this.getElement(parent);
    if (p instanceof HTMLElement)
      p.appendChild(this.elm);
    else
      throw new Error("Invalid parent element, exausted 3 checks.");
    return this;
  }
  prependTo(parent) {
    let p = this.getElement(parent);
    if (p instanceof HTMLElement)
      p.prepend(this.elm);
    return this;
  }
  append(elem) {
    let e = this.getElement(elem);
    if (e instanceof HTMLElement)
      this.elm.appendChild(e);
    else if (typeof elem === "string") {
      const newElem = document.createElement(elem);
      this.elm.appendChild(newElem);
      return new Html(newElem.tagName);
    }
    return this;
  }
  prepend(elem) {
    let e = this.getElement(elem);
    if (e instanceof HTMLElement)
      this.elm.prepend(e);
    else if (typeof elem === "string") {
      const newElem = document.createElement(elem);
      this.elm.prepend(newElem);
      return new Html(newElem.tagName);
    }
    return this;
  }
  appendMany(...elements) {
    for (const elem of elements)
      this.append(elem);
    return this;
  }
  prependMany(...elements) {
    for (const elem of elements)
      this.prepend(elem);
    return this;
  }
  clear() {
    this.elm.innerHTML = "";
    return this;
  }
  attr(obj) {
    for (let key in obj)
      if (obj[key] !== null && obj[key] !== undefined)
        this.elm.setAttribute(key, obj[key]);
      else
        this.elm.removeAttribute(key);
    return this;
  }
  val(str) {
    this.elm.value = str;
    return this;
  }
  getText() {
    return this.elm.innerText;
  }
  getHtml() {
    return this.elm.innerHTML;
  }
  getValue() {
    return this.elm.value;
  }
  swapRef(elm) {
    this.elm = elm;
    return this;
  }
  static from(elm) {
    const qs = () => Html.qs(elm);
    if (typeof elm === "string")
      return qs();
    return new Html(elm);
  }
  static qs(query) {
    if (document.querySelector(query))
      return Html.from(document.querySelector(query));
    return null;
  }
  static qsa(query) {
    if (document.querySelector(query))
      return Array.from(document.querySelectorAll(query)).map((e) => Html.from(e));
    return null;
  }
}

// src/components/Slider.ts
function Slider(property, min, max, update, isUrl = false, valueModifier, noLabel) {
  var prop;
  prop = property || "";
  const container = new Html("div");
  const label = new Html("label").attr({ for: prop }).text(prop);
  const slider = new Html("input").attr({
    id: prop,
    type: "range",
    min: 0,
    max: max - min,
    value: update(prop, 0, isUrl, true)
  }).on("input", (e) => {
    let value = parseInt(e.target.value) + min;
    if (valueModifier) {
      value = valueModifier(value);
    }
    if (isUrl)
      update(prop, value, true);
    else
      update(prop, value, false);
  });
  if (noLabel === false || noLabel === undefined) {
    container.append(label);
  }
  container.append(slider);
  return container;
}

// src/components/Select.ts
function Select(property, values, update, isUrl, isConfig = false) {
  return new Html("div").appendMany(new Html("label").attr({ for: property }).text(property), new Html("select").attr({
    id: property,
    type: "range"
  }).appendMany(...Object.keys(values).map((key) => new Option(key, values[key]))).on("change", (e) => {
    let value = e.target.value;
    if (isUrl)
      update(property, value, true, false, false, undefined, false, isConfig);
    else
      update(property, value, false, false, false, undefined, false, isConfig);
  }));
}

// src/types/struct/NnMiiCharInfo.ts
var import_lib = __toESM(require_lib(), 1);
var NnMiiCharInfo = import_lib.default.struct("nn::mii::CharInfo", [
  import_lib.default.byte("createId", 16),
  import_lib.default.char16le("nickname", 22),
  import_lib.default.uint8("fontRegion"),
  import_lib.default.uint8("favoriteColor"),
  import_lib.default.uint8("gender"),
  import_lib.default.uint8("height"),
  import_lib.default.uint8("build"),
  import_lib.default.uint8("type"),
  import_lib.default.uint8("regionMove"),
  import_lib.default.uint8("facelineType"),
  import_lib.default.uint8("facelineColor"),
  import_lib.default.uint8("facelineWrinkle"),
  import_lib.default.uint8("facelineMake"),
  import_lib.default.uint8("hairType"),
  import_lib.default.uint8("hairColor"),
  import_lib.default.uint8("hairFlip"),
  import_lib.default.uint8("eyeType"),
  import_lib.default.uint8("eyeColor"),
  import_lib.default.uint8("eyeScale"),
  import_lib.default.uint8("eyeAspect"),
  import_lib.default.uint8("eyeRotate"),
  import_lib.default.uint8("eyeX"),
  import_lib.default.uint8("eyeY"),
  import_lib.default.uint8("eyebrowType"),
  import_lib.default.uint8("eyebrowColor"),
  import_lib.default.uint8("eyebrowScale"),
  import_lib.default.uint8("eyebrowAspect"),
  import_lib.default.uint8("eyebrowRotate"),
  import_lib.default.uint8("eyebrowX"),
  import_lib.default.uint8("eyebrowY"),
  import_lib.default.uint8("noseType"),
  import_lib.default.uint8("noseScale"),
  import_lib.default.uint8("noseY"),
  import_lib.default.uint8("mouthType"),
  import_lib.default.uint8("mouthColor"),
  import_lib.default.uint8("mouthScale"),
  import_lib.default.uint8("mouthAspect"),
  import_lib.default.uint8("mouthY"),
  import_lib.default.uint8("beardColor"),
  import_lib.default.uint8("beardType"),
  import_lib.default.uint8("mustacheType"),
  import_lib.default.uint8("mustacheScale"),
  import_lib.default.uint8("mustacheY"),
  import_lib.default.uint8("glassType"),
  import_lib.default.uint8("glassColor"),
  import_lib.default.uint8("glassScale"),
  import_lib.default.uint8("glassY"),
  import_lib.default.uint8("moleType"),
  import_lib.default.uint8("moleScale"),
  import_lib.default.uint8("moleX"),
  import_lib.default.uint8("moleY"),
  import_lib.default.uint8("reserved")
]);

// src/util/parseString.ts
var stripSpaces = function(str) {
  return str.replace(/\s+/g, "");
};
var hexToUint8Array = function(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(function(byte) {
    return parseInt(byte, 16);
  }));
};
var base64ToUint8Array = function(base64) {
  var normalizedBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  var padBase64 = function(str) {
    while (str.length % 4 !== 0) {
      str += "=";
    }
    return str;
  };
  var paddedBase64 = padBase64(normalizedBase64);
  var binaryString = atob(paddedBase64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0;i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
var parseHexOrB64TextStringToUint8Array = function(text) {
  var inputData;
  var textData = stripSpaces(text);
  if (/^[0-9a-fA-F]+$/.test(textData))
    inputData = hexToUint8Array(textData);
  else
    inputData = base64ToUint8Array(textData);
  return inputData;
};
function dataToHex(data) {
  return Array.from(data, (i) => i.toString(16).padStart(2, "0")).join("");
}

// src/components/Header.ts
var Header = (title) => {
  return new Html("span").class("header").text(title);
};
var Subheader = (title) => {
  return new Html("span").class("sub-header").text(title);
};

// src/components/Array.ts
function Array2(property, min, max, length, update, valueModifier, noLabel) {
  var prop;
  prop = property || "";
  const container = new Html("div");
  const label = new Html("label").attr({ for: prop }).text(prop);
  if (noLabel === false || noLabel === undefined) {
    container.append(label);
  }
  for (var i = 0;i < length; i++) {
    var index = i;
    const slider = new Html("input").attr({
      id: prop,
      type: "text",
      minLength: 0,
      maxLength: max - min,
      value: update(prop, 0, false, true, false, index.toString()).toString(16).padStart(2, "0")
    }).class("array").on("input", (e) => {
      let value = parseInt(e.target.value, 16) + min;
      if (valueModifier) {
        value = valueModifier(value);
      }
      console.log("h");
      update(prop, value, false, false, false, index.toString(), true);
    });
    container.append(slider);
  }
  return container;
}

// src/components/String.ts
function String2(property, min, max, update, isUrl, noLabel = false, isConfig = false) {
  const container = new Html("div");
  const label = new Html("label").attr({ for: property }).text(property);
  const input = new Html("input").attr({
    id: property,
    type: "text",
    minLength: min,
    maxLength: max,
    value: update(property, 0, isUrl, true, false, undefined, false, true)
  }).on("input", (e) => {
    let value = e.target.value;
    if (isUrl)
      update(property, value, true, false, false, undefined, false, isConfig);
    else
      update(property, value, false, false, false, undefined, false, isConfig);
  });
  if (noLabel === false) {
    label.appendTo(container);
  }
  input.appendTo(container);
  return container;
}

// src/util/propsToComponentCollection.ts
function propsToComponentCollection(props, update) {
  var list = [];
  for (var i = 0;i < Object.keys(props).length; i++) {
    (function() {
      var index = i;
      var key = Object.keys(props)[index];
      var prop = props[key];
      var container = new Html("div");
      new Html("label").text(prop.name || key).appendTo(container);
      let input;
      switch (prop.type) {
        case 0 /* Number */:
          input = Slider(key, prop.min, prop.max, update, false, undefined, true);
          break;
        case 1 /* String */:
          input = String2(key, prop.min, prop.max, update, false, true);
          break;
        case 2 /* Array */:
          input = Array2(key, prop.min, prop.max, prop.size, update, undefined, true);
          break;
      }
      container.append(input);
      container.append(new Html("button").text("Reset").on("click", (e) => {
        console.log(key);
        switch (prop.type) {
          case 0 /* Number */:
            input.qs("input").val(prop.default);
            console.log(i, index);
            break;
          case 1 /* String */:
            input.qs("input").val(prop.default);
            break;
          case 2 /* Array */:
            input.qsa("input").forEach((item, index2) => {
              item.val(prop.default[index2].toString().padStart(2, "0"));
            });
            break;
        }
        update(key, prop.default, false, false, false);
      }));
      list.push(container);
    })();
  }
  return list;
}

// src/util/CharInfoProps.ts
var CharInfoProps = {
  beardColor: { type: 0 /* Number */, default: 0, min: 0, max: 99 },
  beardType: { type: 0 /* Number */, default: 0, min: 0, max: 5 },
  build: { type: 0 /* Number */, default: 64, min: 0, max: 127 },
  createId: {
    type: 2 /* Array */,
    default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    min: 0,
    max: 255,
    size: 16
  },
  eyeAspect: { type: 0 /* Number */, default: 3, min: 0, max: 6 },
  eyeColor: { type: 0 /* Number */, default: 8, min: 0, max: 99 },
  eyeRotate: { type: 0 /* Number */, default: 4, min: 0, max: 7 },
  eyeScale: { type: 0 /* Number */, default: 4, min: 0, max: 7 },
  eyeType: { type: 0 /* Number */, default: 2, min: 0, max: 59 },
  eyeX: { type: 0 /* Number */, default: 2, min: 0, max: 12 },
  eyeY: { type: 0 /* Number */, default: 12, min: 0, max: 18 },
  eyebrowAspect: { type: 0 /* Number */, default: 3, min: 0, max: 6 },
  eyebrowColor: { type: 0 /* Number */, default: 1, min: 0, max: 99 },
  eyebrowRotate: { type: 0 /* Number */, default: 6, min: 0, max: 11 },
  eyebrowScale: { type: 0 /* Number */, default: 4, min: 0, max: 8 },
  eyebrowType: { type: 0 /* Number */, default: 6, min: 0, max: 24 },
  eyebrowX: { type: 0 /* Number */, default: 2, min: 0, max: 12 },
  eyebrowY: { type: 0 /* Number */, default: 10, min: 3, max: 18 },
  facelineColor: { type: 0 /* Number */, default: 0, min: 0, max: 9 },
  facelineMake: { type: 0 /* Number */, default: 0, min: 0, max: 11 },
  facelineType: { type: 0 /* Number */, default: 0, min: 0, max: 11 },
  facelineWrinkle: { type: 0 /* Number */, default: 0, min: 0, max: 11 },
  favoriteColor: { type: 0 /* Number */, default: 0, min: 0, max: 11 },
  fontRegion: { type: 0 /* Number */, default: 0, min: 0, max: 3 },
  gender: { type: 0 /* Number */, default: 0, min: 0, max: 1 },
  glassColor: { type: 0 /* Number */, default: 8, min: 0, max: 99 },
  glassScale: { type: 0 /* Number */, default: 4, min: 0, max: 7 },
  glassType: { type: 0 /* Number */, default: 0, min: 0, max: 19 },
  glassY: { type: 0 /* Number */, default: 10, min: 0, max: 20 },
  hairColor: { type: 0 /* Number */, default: 1, min: 0, max: 99 },
  hairFlip: { type: 0 /* Number */, default: 0, min: 0, max: 1 },
  hairType: { type: 0 /* Number */, default: 33, min: 0, max: 131 },
  height: { type: 0 /* Number */, default: 64, min: 0, max: 127 },
  moleScale: { type: 0 /* Number */, default: 4, min: 0, max: 8 },
  moleType: { type: 0 /* Number */, default: 0, min: 0, max: 1 },
  moleX: { type: 0 /* Number */, default: 2, min: 0, max: 16 },
  moleY: { type: 0 /* Number */, default: 20, min: 0, max: 30 },
  mouthAspect: { type: 0 /* Number */, default: 3, min: 0, max: 6 },
  mouthColor: { type: 0 /* Number */, default: 19, min: 0, max: 99 },
  mouthScale: { type: 0 /* Number */, default: 4, min: 0, max: 8 },
  mouthType: { type: 0 /* Number */, default: 23, min: 0, max: 35 },
  mouthY: { type: 0 /* Number */, default: 13, min: 0, max: 18 },
  mustacheScale: { type: 0 /* Number */, default: 4, min: 0, max: 8 },
  mustacheType: { type: 0 /* Number */, default: 0, min: 0, max: 5 },
  mustacheY: { type: 0 /* Number */, default: 10, min: 0, max: 16 },
  nickname: { type: 1 /* String */, default: "Mii", min: 1, max: 10 },
  noseScale: { type: 0 /* Number */, default: 4, min: 0, max: 8 },
  noseType: { type: 0 /* Number */, default: 1, min: 0, max: 17 },
  noseY: { type: 0 /* Number */, default: 9, min: 0, max: 18 },
  regionMove: { type: 0 /* Number */, default: 0, min: 0, max: 3 },
  reserved: { type: 0 /* Number */, default: 0, min: 0, max: 1 },
  type: { type: 0 /* Number */, default: 0, min: 0, max: 1 }
};

// src/util/rendererPropLists.ts
var viewList = {
  Portrait: "face",
  "Head Only": "face_only",
  "Head Only Alt": "fflmakeicon",
  "Whole Body": "all_body_sugar",
  "Whole Body Alt": "all_body",
  "Portrait Alt": "variableiconbody",
  FFLIconWithBody: "ffliconwithbody"
};
var originList = {
  "(default)": "http://mii-renderer.nxw.pw",
  "localhost:5000": "http://localhost:5000",
  "mii-renderer.nxw.pw": "https://mii-renderer.nxw.pw",
  "mii-unsecure.ariankordi.net": "https://mii-unsecure.ariankordi.net"
};
var shaderList = {
  "(default)": "-1",
  "Wii U": "wiiu",
  "Wii U (Blinn)": "wiiu_blinn",
  "Wii U (Bright)": "ffliconwithbody",
  Switch: "switch",
  Miitomo: "miitomo"
};
var bodyList = {
  "(default)": "-1",
  "Wii U": "wiiu",
  Switch: "switch",
  Miitomo: "miitomo",
  FFLBodyRes: "fflbodyres",
  "3DS": "3ds"
};

// src/types/struct/FFLStoreData.ts
var import_lib2 = __toESM(require_lib(), 1);
var FFLiCreateID = import_lib2.default.struct([
  import_lib2.default.ubit("flag_normal", 1),
  import_lib2.default.ubit("flag_1", 1),
  import_lib2.default.ubit("flag_temporary", 1),
  import_lib2.default.ubit("flag_3", 1),
  import_lib2.default.ubit("create_date1", 14),
  import_lib2.default.ubit("create_date2", 14),
  import_lib2.default.byte("base", 6)
]);
var FFLiAuthorID = import_lib2.default.struct([import_lib2.default.byte("data", 8)]);
var Ver3StoreData = import_lib2.default.struct("Ver3StoreData", [
  import_lib2.default.ubitLE("mii_version", 8),
  import_lib2.default.ubitLE("copyable", 1),
  import_lib2.default.ubitLE("ng_word", 1),
  import_lib2.default.ubitLE("region_move", 2),
  import_lib2.default.ubitLE("font_region", 2),
  import_lib2.default.ubitLE("reserved_0", 2),
  import_lib2.default.ubitLE("room_index", 4),
  import_lib2.default.ubitLE("position_in_room", 4),
  import_lib2.default.ubitLE("author_type", 4),
  import_lib2.default.ubitLE("birth_platform", 3),
  import_lib2.default.ubitLE("reserved_1"),
  import_lib2.default.struct("author_id", [FFLiAuthorID]),
  import_lib2.default.struct("create_id", [FFLiCreateID]),
  import_lib2.default.byte("reserved_2", 2),
  import_lib2.default.ubitLE("gender", 1),
  import_lib2.default.ubitLE("birth_month", 4),
  import_lib2.default.ubitLE("birth_day", 5),
  import_lib2.default.ubitLE("favorite_color", 4),
  import_lib2.default.ubitLE("favorite", 1),
  import_lib2.default.ubitLE("padding_0", 1),
  import_lib2.default.char16le("name", 20),
  import_lib2.default.uint8("height"),
  import_lib2.default.uint8("build"),
  import_lib2.default.ubitLE("localonly", 1),
  import_lib2.default.ubitLE("face_type", 4),
  import_lib2.default.ubitLE("face_color", 3),
  import_lib2.default.ubitLE("face_tex", 4),
  import_lib2.default.ubitLE("face_make", 4),
  import_lib2.default.ubitLE("hair_type", 8),
  import_lib2.default.ubitLE("hair_color", 3),
  import_lib2.default.ubitLE("hair_flip", 1),
  import_lib2.default.ubitLE("padding_1", 4),
  import_lib2.default.ubitLE("eye_type", 6),
  import_lib2.default.ubitLE("eye_color", 3),
  import_lib2.default.ubitLE("eye_scale", 4),
  import_lib2.default.ubitLE("eye_aspect", 3),
  import_lib2.default.ubitLE("eye_rotate", 5),
  import_lib2.default.ubitLE("eye_x", 4),
  import_lib2.default.ubitLE("eye_y", 5),
  import_lib2.default.ubitLE("padding_2", 2),
  import_lib2.default.ubitLE("eyebrow_type", 5),
  import_lib2.default.ubitLE("eyebrow_color", 3),
  import_lib2.default.ubitLE("eyebrow_scale", 4),
  import_lib2.default.ubitLE("eyebrow_aspect", 3),
  import_lib2.default.ubitLE("padding_3", 1),
  import_lib2.default.ubitLE("eyebrow_rotate", 5),
  import_lib2.default.ubitLE("eyebrow_x", 4),
  import_lib2.default.ubitLE("eyebrow_y", 5),
  import_lib2.default.ubitLE("padding_4", 2),
  import_lib2.default.ubitLE("nose_type", 5),
  import_lib2.default.ubitLE("nose_scale", 4),
  import_lib2.default.ubitLE("nose_y", 5),
  import_lib2.default.ubitLE("padding_5", 2),
  import_lib2.default.ubitLE("mouth_type", 6),
  import_lib2.default.ubitLE("mouth_color", 3),
  import_lib2.default.ubitLE("mouth_scale", 4),
  import_lib2.default.ubitLE("mouth_aspect", 3),
  import_lib2.default.ubitLE("mouth_y", 5),
  import_lib2.default.ubitLE("mustache_type", 3),
  import_lib2.default.ubitLE("padding_6", 8),
  import_lib2.default.ubitLE("beard_type", 3),
  import_lib2.default.ubitLE("beard_color", 3),
  import_lib2.default.ubitLE("beard_scale", 4),
  import_lib2.default.ubitLE("beard_y", 5),
  import_lib2.default.ubitLE("padding_7", 1),
  import_lib2.default.ubitLE("glasses_type", 4),
  import_lib2.default.ubitLE("glasses_color", 3),
  import_lib2.default.ubitLE("glasses_scale", 4),
  import_lib2.default.ubitLE("glass_y", 5),
  import_lib2.default.ubitLE("mole_type", 1),
  import_lib2.default.ubitLE("mole_scale", 4),
  import_lib2.default.ubitLE("mole_x", 5),
  import_lib2.default.ubitLE("mole_y", 5),
  import_lib2.default.ubitLE("padding_8", 1),
  import_lib2.default.char16le("creator", 20),
  import_lib2.default.uint16le("padding_9"),
  import_lib2.default.uint16("checksum")
]);

// src/types/struct/RFLStoreData.ts
var import_lib3 = __toESM(require_lib(), 1);
var RFLCreateID = import_lib3.default.struct([
  import_lib3.default.uint8("data", 8)
]);
var RFLCharData = import_lib3.default.struct([
  import_lib3.default.ubit("padding0", 1),
  import_lib3.default.ubit("gender", 1),
  import_lib3.default.ubit("birthMonth", 4),
  import_lib3.default.ubit("birthDay", 5),
  import_lib3.default.ubit("favoriteColor", 4),
  import_lib3.default.ubit("favorite", 1),
  import_lib3.default.char16be("name", 20),
  import_lib3.default.uint8("height"),
  import_lib3.default.uint8("build"),
  import_lib3.default.struct("create_id", [RFLCreateID]),
  import_lib3.default.ubit("faceType", 3),
  import_lib3.default.ubit("faceColor", 3),
  import_lib3.default.ubit("faceTex", 4),
  import_lib3.default.ubit("padding_2", 3),
  import_lib3.default.ubit("localonly", 1),
  import_lib3.default.ubit("type", 2),
  import_lib3.default.ubit("hairType", 7),
  import_lib3.default.ubit("hairColor", 3),
  import_lib3.default.ubit("hairFlip", 1),
  import_lib3.default.ubit("padding_3", 5),
  import_lib3.default.ubit("eyebrowType", 5),
  import_lib3.default.ubit("eyebrowRotate", 5),
  import_lib3.default.ubit("padding_4", 6),
  import_lib3.default.ubit("eyebrowColor", 3),
  import_lib3.default.ubit("eyebrowScale", 4),
  import_lib3.default.ubit("eyebrowY", 5),
  import_lib3.default.ubit("eyebrowX", 4),
  import_lib3.default.ubit("eyeType", 6),
  import_lib3.default.ubit("eyeRotate", 5),
  import_lib3.default.ubit("eyeY", 5),
  import_lib3.default.ubit("eyeColor", 3),
  import_lib3.default.ubit("eyeScale", 4),
  import_lib3.default.ubit("eyeX", 4),
  import_lib3.default.ubit("padding_5", 5),
  import_lib3.default.ubit("noseType", 4),
  import_lib3.default.ubit("noseScale", 4),
  import_lib3.default.ubit("noseY", 5),
  import_lib3.default.ubit("padding_6", 3),
  import_lib3.default.ubit("mouthType", 5),
  import_lib3.default.ubit("mouthColor", 2),
  import_lib3.default.ubit("mouthScale", 4),
  import_lib3.default.ubit("mouthY", 5),
  import_lib3.default.ubit("glassType", 4),
  import_lib3.default.ubit("glassColor", 3),
  import_lib3.default.ubit("glassScale", 4),
  import_lib3.default.ubit("glassY", 5),
  import_lib3.default.ubit("mustacheType", 2),
  import_lib3.default.ubit("beardType", 2),
  import_lib3.default.ubit("beardColor", 3),
  import_lib3.default.ubit("beardScale", 4),
  import_lib3.default.ubit("beardY", 5),
  import_lib3.default.ubit("moleType", 1),
  import_lib3.default.ubit("moleScale", 4),
  import_lib3.default.ubit("moleY", 5),
  import_lib3.default.ubit("moleX", 5),
  import_lib3.default.ubit("padding_8", 1),
  import_lib3.default.char16be("creatorName", 20)
]);
var RFLStoreData = import_lib3.default.struct("RFLStoreData", [
  import_lib3.default.struct([RFLCharData]),
  import_lib3.default.uint16("checksum")
]);

// src/lib/conversion/Ver3ToVer1.ts
function Ver3DataToVer1(ver3) {
  const rsd = RFLStoreData.unpack(parseHexOrB64TextStringToUint8Array("0".repeat(76 * 2)));
  const charData = rsd.RFLCharData;
  charData.padding0 = ver3.padding_0;
  charData.gender = ver3.gender;
  charData.birthMonth = ver3.birth_month;
  charData.birthDay = ver3.birth_day;
  charData.favoriteColor = ver3.favorite_color;
  charData.favorite = ver3.favorite;
  charData.name = ver3.name;
  charData.height = ver3.height;
  charData.build = ver3.build;
  charData.create_id = ver3.create_id;
  charData.faceType = ver3.face_type;
  charData.faceColor = ver3.face_color;
  charData.faceTex = ver3.face_make;
  charData.padding_2 = ver3.padding_2;
  charData.localonly = ver3.localonly;
  charData.type = ver3.create_id.flag_normal;
  charData.hairType = ver3.hair_type;
  charData.hairColor = ver3.hair_color;
  charData.hairFlip = ver3.hair_flip;
  charData.padding_3 = ver3.padding_3;
  charData.eyebrowType = ver3.eyebrow_type;
  charData.eyebrowRotate = ver3.eyebrow_rotate;
  charData.padding_4 = ver3.padding_4;
  charData.eyebrowColor = ver3.eyebrow_color;
  charData.eyebrowScale = ver3.eyebrow_scale;
  charData.eyebrowY = ver3.eyebrow_y;
  charData.eyebrowX = ver3.eyebrow_x;
  charData.eyeType = ver3.eye_type;
  charData.eyeRotate = ver3.eye_rotate;
  charData.eyeY = ver3.eye_y;
  charData.eyeColor = ver3.eye_color;
  charData.eyeScale = ver3.eye_scale;
  charData.eyeX = ver3.eye_x;
  charData.padding_5 = ver3.padding_5;
  charData.noseType = ver3.nose_type;
  charData.noseScale = ver3.nose_scale;
  charData.noseY = ver3.nose_y;
  charData.padding_6 = ver3.padding_6;
  charData.mouthType = ver3.mouth_type;
  charData.mouthColor = ver3.mouth_color;
  charData.mouthScale = ver3.mouth_scale;
  charData.mouthY = ver3.mouth_y;
  charData.glassType = ver3.glasses_type;
  charData.glassColor = ver3.glasses_color;
  charData.glassScale = ver3.glasses_scale;
  charData.glassY = ver3.glass_y;
  charData.mustacheType = ver3.mustache_type;
  charData.beardType = ver3.beard_type;
  charData.beardColor = ver3.beard_color;
  charData.beardScale = ver3.beard_scale;
  charData.beardY = ver3.beard_y;
  charData.moleType = ver3.mole_type;
  charData.moleScale = ver3.mole_scale;
  charData.moleY = ver3.mole_y;
  charData.moleX = ver3.mole_x;
  charData.padding_8 = ver3.padding_8;
  charData.creatorName = ver3.creator;
  return RFLStoreData.pack(rsd);
}

// src/main.ts
window.Ver3DataToVer1 = Ver3DataToVer1;
new Html("span").class("small").style({ position: "fixed", top: "2vmax", left: "3vmax", opacity: "0.4" }).text("Switch CharInfo editor by kat21").appendTo("body");
var leftContainer = new Html("div").class("left-col").appendTo("body");
var rightContainer = new Html("div").class("right-col").appendTo("body");
var image = new Html("img").style({ width: "420px", height: "420px", "object-fit": "contain" }).appendTo(leftContainer);
var dataBox = new Html("textarea").attr({ rows: 4, cols: 60 }).on("input", (e) => {
  try {
    mii = NnMiiCharInfo.unpack(parseHexOrB64TextStringToUint8Array(dataBox.getValue()));
  } catch (e2) {
  }
  render(false);
}).appendTo(leftContainer);
var mii = NnMiiCharInfo.unpack(parseHexOrB64TextStringToUint8Array("7C06FA4EF33C09E49286729A98DF0F574A00610073006D0069006E0065000000000000000000000B011C370000090000017B01002108070303020E0D08040607060C0000041E1301040D06000004100310070B00010C1B00"));
window.mii = mii;
var params = new URLSearchParams("?verifyCharInfo=0&lightXDirection=0&lightYDirection=0&lightZDirection=0");
function render(updateTextBox = true) {
  params.set("data", dataToHex(NnMiiCharInfo.pack(mii)));
  var final = config.origin + config.baseURL + "?" + params.toString();
  switch (mii.type) {
    case 0:
      params.set("pantsColor", "gray");
      break;
    case 1:
      params.set("pantsColor", "gold");
      break;
  }
  image.attr({
    src: final
  });
  if (updateTextBox)
    dataBox.val(dataToHex(NnMiiCharInfo.pack(mii)));
  if (finalURL) {
    finalURL.html(final);
  }
}
var config = {
  origin: "https://mii-renderer.nxw.pw",
  baseURL: "/miis/image.png"
};
if (location.hostname === "localhost") {
  config.origin = "http://localhost:5000";
}
function Update(prop, value, isUrl, returnOnly, shouldValidate, subProp, isNumber, isConfig) {
  console.log(`update(prop:`, prop, `value:`, value, `, isUrl:`, isUrl, `, returnOnly: `, returnOnly, `, shouldValidate: `, shouldValidate, `, subProp: `, subProp, "isConfig", isConfig);
  if (isConfig) {
    if (returnOnly) {
      return config[prop];
    }
    config[prop] = value;
    render();
    return;
  }
  if (shouldValidate)
    return params.get("verifyCharInfo");
  if (returnOnly) {
    if (subProp !== undefined) {
      return mii[prop][subProp];
    } else {
      if (isUrl)
        return Number(params.get(prop));
      else
        return mii[prop];
    }
  }
  if (subProp !== undefined) {
    console.log("subprop found");
    if (isNumber) {
      mii[prop][subProp] = parseInt(value);
      console.log(`mii["${prop}"]["${subProp}"] =`, parseInt(value));
    } else {
      mii[prop][subProp] = value;
      console.log(`mii["${prop}"]["${subProp}"] =`, value);
    }
  } else {
    if (isUrl)
      params.set(prop, value);
    else
      mii[prop] = value;
    console.log("no subprop");
  }
  render();
  render();
}
render();
var finalURL = new Html("textarea").attr({ rows: 4 }).style({ width: "100%" });
rightContainer.appendMany(Header("Generated URL"), finalURL, Header("Renderer"), Subheader("URL"), Select("origin", originList, Update, true, true), String2("baseURL", 0, 100, Update, false, false, true), Subheader("Validation"), Slider("verifyCharInfo", 0, 1, Update, true), Slider("verifyCRC16", 0, 1, Update, true), Subheader("Display"), Select("type", viewList, Update, true), Select("shaderType", shaderList, Update, true), Select("bodyType", bodyList, Update, true), Subheader("Headwear"), Slider("headwearIndex", 0, 9, Update, true), Slider("headwearColor", 0, 12, Update, true, (val) => val - 1), Subheader("Rotation"), Slider("characterXRotate", 0, 359, Update, true), Slider("characterYRotate", 0, 359, Update, true), Slider("characterZRotate", 0, 359, Update, true), Subheader("Light Direction"), Slider("lightXDirection", 0, 359, Update, true), Slider("lightYDirection", 0, 359, Update, true), Slider("lightZDirection", 0, 359, Update, true), Header("CharInfo"), ...propsToComponentCollection(CharInfoProps, Update));
render();

//# debugId=90FE224CDFA9483E64756E2164756E21
//# sourceMappingURL=main.js.map
