import Html from "@datkat21/html";
import { PropType, type Prop, type PropTable } from "../types/Props";
import { Slider } from "../components/Slider";
import { Array } from "../components/Array";
import type { UpdateFunction } from "../types/UpdateFunction";
import { String } from "../components/String";

export function propsToComponentCollection(
  props: PropTable,
  update: UpdateFunction
) {
  var list: Html[] = [];

  for (var i = 0; i < Object.keys(props).length; i++) {
    // HACK
    (function () {
      var index = i;
      var key = Object.keys(props)[index];
      var prop = props[key] as Prop;

      var container = new Html("div");
      // label
      new Html("label").text(prop.name || key).appendTo(container);

      let input: Html;

      switch (prop.type) {
        case PropType.Number:
          input = Slider(
            key,
            prop.min,
            prop.max,
            update,
            false,
            undefined,
            true
          );

          break;
        case PropType.String:
          input = String(key, prop.min, prop.max, update, false, true);
          break;
        case PropType.Array:
          input = Array(
            key,
            prop.min,
            prop.max,
            prop.size,
            update,
            undefined,
            true
          );
          break;
      }
      container.append(input);

      container.append(
        new Html("button").text("Reset").on("click", (e) => {
          console.log(key);
          switch (prop.type) {
            case PropType.Number:
              // var i = input.qs("input")!.elm as HTMLInputElement;
              // i.value = prop.default as any as string;
              input.qs("input")!.val(prop.default);
              console.log(i, index);
              break;
            case PropType.String:
              input.qs("input")!.val(prop.default);
              break;
            case PropType.Array:
              input.qsa("input")!.forEach((item, index) => {
                item!.val(
                  (prop.default! as any)[index].toString().padStart(2, "0")
                );
              });
              break;
          }
          update(key, prop.default, false, false, false);
        })
      );

      list.push(container);
    })();
  }
  return list;
}
