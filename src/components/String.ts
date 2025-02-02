import Html from "@datkat21/html";
import type { UpdateFunction } from "../types/UpdateFunction";

export function String(
  property: string,
  min: number,
  max: number,
  update: UpdateFunction,
  isUrl: boolean,
  noLabel: boolean = false,
  isConfig: boolean = false
) {
  const container = new Html("div");
  const label = new Html("label").attr({ for: property }).text(property);
  const input = new Html("input")
    .attr({
      id: property,
      type: "text",
      minLength: min,
      maxLength: max,
      value: update(property, 0, isUrl, true, false, undefined, false, true),
    })
    .on("input", (e) => {
      let value = (e.target as any).value;

      if (isUrl)
        update(property, value, true, false, false, undefined, false, isConfig);
      else
        update(
          property,
          value,
          false,
          false,
          false,
          undefined,
          false,
          isConfig
        );
    });

  if (noLabel === false) {
    label.appendTo(container);
  }

  input.appendTo(container);
  return container;
}
