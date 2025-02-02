import Html from "@datkat21/html";

export const Header = (title: string) => {
  return new Html("span").class("header").text(title);
};

export const Subheader = (title: string) => {
  return new Html("span").class("sub-header").text(title);
};
