import Html from "@datkat21/html";
import { GenericType } from "../types/GenericType";
import type { UpdateFunction } from "../types/UpdateFunction";

export function Select(
  property: string,
  values: Record<string, any>,
  update: UpdateFunction,
  isUrl: boolean,
  isConfig: boolean = false
) {
  return new Html("div").appendMany(
    new Html("label").attr({ for: property }).text(property),
    new Html("select")
      .attr({
        id: property,
        type: "range",
      })
      .appendMany(
        ...Object.keys(values).map((key) => new Option(key, values[key]))
      )
      .on("change", (e) => {
        let value = (e.target as any).value;

        if (isUrl)
          update(
            property,
            value,
            true,
            false,
            false,
            undefined,
            false,
            isConfig
          );
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
      })
  );
}
