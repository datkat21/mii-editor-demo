import Html from "@datkat21/html";
import { GenericType } from "../types/GenericType";
import type { UpdateFunction } from "../types/UpdateFunction";

export function Slider(
  property: string | undefined,
  min: number,
  max: number,
  update: UpdateFunction,
  // type: GenericType,
  isUrl: boolean = false,
  valueModifier?: (val: any) => any,
  noLabel?: boolean
) {
  var prop: string;
  prop = property || "";
  const container = new Html("div");
  const label = new Html("label").attr({ for: prop }).text(prop);

  const slider = new Html("input")
    .attr({
      id: prop,
      type: "range",
      min: 0,
      max: max - min,
      value: update(prop, 0, isUrl, true),
    })
    .on("input", (e) => {
      let value = parseInt((e.target as any).value) + min;

      if (valueModifier) {
        value = valueModifier(value);
      }

      if (isUrl) update(prop, value, true);
      else update(prop, value, false);
    });

  if (noLabel === false || noLabel === undefined) {
    container.append(label);
  }
  container.append(slider);

  return container;
}
