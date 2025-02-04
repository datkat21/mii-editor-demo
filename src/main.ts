import _ from "./lib/struct-fu/lib";
import Html from "@datkat21/html";
import { Slider } from "./components/Slider";
import { GenericType } from "./types/GenericType";
import { Select } from "./components/Select";
import { NnMiiCharInfo } from "./types/struct/NnMiiCharInfo";
import {
  dataToHex,
  parseHexOrB64TextStringToUint8Array,
} from "./util/parseString";
import { Header, Subheader } from "./components/Header";
import { propsToComponentCollection } from "./util/propsToComponentCollection";
import { CharInfoProps } from "./util/CharInfoProps";
import { String } from "./components/String";
import {
  bodyList,
  originList,
  shaderList,
  viewList,
} from "./util/rendererPropLists";
import { Ver3StoreData } from "./types/struct/FFLStoreData";
import { RFLCharData, RFLStoreData } from "./types/struct/RFLStoreData";
import { Ver3DataToVer1 } from "./lib/conversion/Ver3ToVer1";

// test structs in window for debugging
Ver3StoreData;
RFLCharData;
RFLStoreData;
//@ts-expect-error
window.Ver3DataToVer1 = Ver3DataToVer1;

new Html("span")
  .class("small")
  .style({ position: "fixed", top: "2vmax", left: "3vmax", opacity: "0.4" })
  .text("Switch CharInfo editor by kat21")
  .appendTo("body");

let leftContainer = new Html("div").class("left-col").appendTo("body");
let rightContainer = new Html("div").class("right-col").appendTo("body");

let image = new Html("img")
  .style({ width: "420px", height: "420px", "object-fit": "contain" })
  .appendTo(leftContainer);

let dataBox = new Html("textarea")
  .attr({ rows: 4, cols: 60 })
  .on("input", (e) => {
    try {
      mii = NnMiiCharInfo.unpack(
        parseHexOrB64TextStringToUint8Array(dataBox.getValue())
      );
    } catch (e) {}
    render(false);
  })
  .appendTo(leftContainer);

var mii = NnMiiCharInfo.unpack(
  parseHexOrB64TextStringToUint8Array(
    "7C06FA4EF33C09E49286729A98DF0F574A00610073006D0069006E0065000000000000000000000B011C370000090000017B01002108070303020E0D08040607060C0000041E1301040D06000004100310070B00010C1B00"
    // "dd2102ee1bce8996807e6f5216c652734d00690069000000000000000000000000000000000000000040400000000000002101000208040304020c0601040306020a010409171304030d000000040a0008040a0004021400"
  )
);

//@ts-expect-error
window.mii = mii;

let params = new URLSearchParams(
  "?verifyCharInfo=0&lightXDirection=0&lightYDirection=0&lightZDirection=0"
);

function render(updateTextBox: boolean = true) {
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
    src: final,
  });
  if (updateTextBox) dataBox.val(dataToHex(NnMiiCharInfo.pack(mii)));
  if (finalURL) {
    finalURL.html(final);
  }
}

const config: Record<string, string> = {
  origin: "https://mii-renderer.nxw.pw",
  baseURL: "/miis/image.png",
};

if (location.hostname === "localhost") {
  config.origin = "http://localhost:5000";
}

function Update(
  prop: string,
  value: any,
  isUrl: boolean,
  returnOnly?: boolean,
  shouldValidate?: boolean,
  subProp?: string,
  isNumber?: boolean,
  isConfig?: boolean
) {
  console.log(
    `update(prop:`,
    prop,
    `value:`,
    value,
    `, isUrl:`,
    isUrl,
    `, returnOnly: `,
    returnOnly,
    `, shouldValidate: `,
    shouldValidate,
    `, subProp: `,
    subProp,
    "isConfig",
    isConfig
  );
  if (isConfig) {
    if (returnOnly) {
      return config[prop];
    }
    config[prop] = value;
    render();
    return;
  }
  if (shouldValidate) return params.get("verifyCharInfo");
  if (returnOnly) {
    if (subProp !== undefined) {
      return (mii as any)[prop][subProp];
    } else {
      if (isUrl) return Number(params.get(prop));
      else return (mii as any)[prop];
    }
  }
  if (subProp !== undefined) {
    console.log("subprop found");
    // if (isUrl) params.set(prop[subProp], value);
    if (isNumber) {
      (mii as any)[prop][subProp] = parseInt(value);
      console.log(`mii["${prop}"]["${subProp}"] =`, parseInt(value));
    } else {
      (mii as any)[prop][subProp] = value;
      console.log(`mii["${prop}"]["${subProp}"] =`, value);
    }
  } else {
    if (isUrl) params.set(prop, value);
    else (mii as any)[prop] = value;
    console.log("no subprop");
  }

  render();
  //HACK: call render twice
  render();
}

render();

var finalURL = new Html("textarea").attr({ rows: 4 }).style({ width: "100%" });

rightContainer.appendMany(
  Header("Generated URL"),
  finalURL,
  Header("Renderer"),
  Subheader("URL"),
  Select("origin", originList, Update, true, true),
  String("baseURL", 0, 100, Update, false, false, true),
  Subheader("Validation"),
  Slider("verifyCharInfo", 0, 1, Update, true),
  Slider("verifyCRC16", 0, 1, Update, true),
  Subheader("Display"),
  Select("type", viewList, Update, true),
  Select("shaderType", shaderList, Update, true),
  Select("bodyType", bodyList, Update, true),
  Subheader("Headwear"),
  Slider("headwearIndex", 0, 9, Update, true),
  Slider("headwearColor", 0, 12, Update, true, (val) => val - 1),
  Subheader("Rotation"),
  Slider("characterXRotate", 0, 359, Update, true),
  Slider("characterYRotate", 0, 359, Update, true),
  Slider("characterZRotate", 0, 359, Update, true),
  Subheader("Light Direction"),
  Slider("lightXDirection", 0, 359, Update, true),
  Slider("lightYDirection", 0, 359, Update, true),
  Slider("lightZDirection", 0, 359, Update, true),
  Header("CharInfo"),
  ...propsToComponentCollection(CharInfoProps, Update)
);

// hack: force a render
render();
