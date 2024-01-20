import { useEffect, useState } from "react";
import breask from "@bytemd/plugin-breaks";
import frontmatter from "@bytemd/plugin-frontmatter";
import gemoji from "@bytemd/plugin-gemoji";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import math from "@bytemd/plugin-math";
import mediumZoom from "@bytemd/plugin-medium-zoom";
import mermaid from "@bytemd/plugin-mermaid";
import { Editor, Viewer } from "@bytemd/react";
import type { BytemdPlugin } from "bytemd";
import themes from "./theme";
import type { ThemeKey } from "./theme";

function loadThemeCss(css: string) {
  const existingStyle = document.getElementById("_theme-style");
  if (existingStyle) {
    existingStyle.innerHTML = css;
  } else {
    const style = document.createElement("style");
    style.id = "_theme-style";
    style.innerHTML = css;
    document.head.appendChild(style);
  }
}

function loadHighlightLinkCss(name: string) {
  const url = `https://g.alicdn.com/code/lib/highlight.js/11.9.0/styles/${name}.min.css`;
  const existingLink = document.getElementById("_theme-highlight-link");
  if (existingLink) {
    existingLink.setAttribute("href", url);
  } else {
    const link = document.createElement("link");
    link.id = "_theme-highlight-link";
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", url);
    link.onerror = () => {
      link.setAttribute(
        "href",
        "`https://g.alicdn.com/code/lib/highlight.js/11.9.0/styles/default.min.css`"
      );
    };
    document.head.appendChild(link);
  }
}

async function uploadImg(file: File): Promise<{ name: string }> {
  const data = new FormData();

  data.append("img", file);

  return fetch("./update-img", {
    method: "post",
    body: data,
  }).then((data) => data.json());
}

const plugins: BytemdPlugin[] = [
  gfm(),
  breask(),
  frontmatter(),
  gemoji(),
  highlight(),
  math(),
  mediumZoom(),
  mermaid(),
  {
    actions: [
      {
        title: "主题",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="icon" viewBox="0 0 1024 1024"><path fill="#F4E67F" d="m417.344 131.008-216 374.144v-4.224L1.728 442.752l4.096-6.912 195.52-331.968 2.048 1.984h193.6l20.352 25.152z"/><path fill="#74EB74" d="m642.112 105.856-440.768 763.52V500.928l-19.52-5.632 220.8-382.528 109.312 135.488 115.072-142.4h15.104z"/><path fill="#7EFFF8" d="M201.344 795.776 531.52 224.128l95.488-118.272H820.48L365.184 920.128h-163.84V795.776z"/><path fill="#92D3FF" d="M569.152 920.128h-235.52l470.144-814.272h16.704l112.128 184.768-363.456 629.504z"/><path fill="#ECA9FC" d="M803.136 920.128H567.488l364.288-630.976 90.496 153.6-199.616 58.176v385.344l-19.52 33.856z"/></svg>`,
        handler: {
          type: "dropdown",
          actions: Object.keys(themes).map((key) => ({
            title: key,
            handler: {
              type: "action",
              click() {
                const { style, highlight } = themes[key as ThemeKey];

                loadThemeCss(style);
                loadHighlightLinkCss(highlight || "default");
                localStorage.setItem("themeKey", key);
              },
            },
          })),
        },
      },
    ],
  },
];

export default () => {
  const [value, setValue] = useState(localStorage.getItem("editorValue") || "");
  const [isPreview] = useState(
    new URLSearchParams(window.location.search).get("p") === "1"
  );

  useEffect(() => {
    const themeKey = localStorage.getItem("themeKey") || Object.keys(themes)[0];
    const { style, highlight } = themes[themeKey as ThemeKey];

    loadThemeCss(style);
    loadHighlightLinkCss(highlight || "default");
  }, []);

  return isPreview ? (
    <div className="bytemd-preview preview">
      <Viewer value={value} plugins={plugins} />
    </div>
  ) : (
    <div>
      <input
        className="input-title"
        type="text"
        placeholder="标题…"
        autoComplete="off"
      />
      <Editor
        value={value}
        plugins={plugins}
        onChange={(v) => {
          setValue(v);
          localStorage.setItem("editorValue", v);
        }}
        uploadImages={async (files) => {
          return await Promise.all(files.map((file) => uploadImg(file))).then(
            (res) =>
              res.map((r) => ({
                title: "",
                url: r.name,
                alt: "",
              }))
          );
        }}
      />
    </div>
  );
};
