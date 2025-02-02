import Html from "@datkat21/html";
import type { UpdateFunction } from "../types/UpdateFunction";

export function Array(
  property: string | undefined,
  min: number,
  max: number,
  length: number,
  update: UpdateFunction,
  valueModifier?: (val: any) => any,
  noLabel?: boolean
) {
  var prop: string;
  prop = property || "";
  const container = new Html("div");
  const label = new Html("label").attr({ for: prop }).text(prop);

  if (noLabel === false || noLabel === undefined) {
    container.append(label);
  }

  for (var i = 0; i < length; i++) {
    var index = i;
    const slider = new Html("input")
      .attr({
        id: prop,
        type: "text",
        minLength: 0,
        maxLength: max - min,
        value: update(prop, 0, false, true, false, index.toString())
          .toString(16)
          .padStart(2, "0"),
      })
      .class("array")
      .on("input", (e) => {
        let value = parseInt((e.target as any).value, 16) + min;

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
