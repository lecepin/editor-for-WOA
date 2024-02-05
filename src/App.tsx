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
import prettier from "prettier/standalone";
import pluginMarkdown from "prettier/plugins/markdown";
import pluginBabel from "prettier/plugins/babel";
import pluginEstree from "prettier/plugins/estree";
import themes from "./theme";
import type { ThemeKey } from "./theme";

function addSpaceBetweenChineseAndEnglish(text: string) {
  return text
    .replace(/([一-龥])([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])([一-龥])/g, "$1 $2");
}

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
        "https://g.alicdn.com/code/lib/highlight.js/11.9.0/styles/default.min.css"
      );
    };
    document.head.appendChild(link);
  }
}

async function uploadImg(file: File): Promise<{ name: string }> {
  const formData = new FormData();
  formData.append("image", file);

  return fetch("/file.php", {
    method: "POST",
    body: formData,
  }).then((response) => response.json());
}

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
    {
      actions: [
        {
          title: "格式化",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" class="icon" viewBox="0 0 1024 1024"><path fill="#FFC738" d="M136.533 0h750.934Q1024 0 1024 136.533v750.934Q1024 1024 887.467 1024H136.533Q0 1024 0 887.467V136.533Q0 0 136.533 0Z"/><path fill="#EAB83A" d="m458.534 324.076-80.555-10.705-36.045-66.6-36.1 66.6-80.554 10.705 58.272 51.882-13.667 73.237 72.05-34.57 72.048 34.57-13.736-73.237z"/><path fill="#30384F" d="m799.061 782.336-66.628 39.117c-12.588 7.386-22.897-.3-22.897-17.08v-78.507a51.528 51.528 0 0 1 23.443-42.517l65.536-33.505c12.889-6.608 23.443 1.734 23.443 18.514v70.014a55.665 55.665 0 0 1-22.897 43.964zm-2.921-144.862-69.783 37a56.648 56.648 0 0 1-47.227 0l-72.212-38.229a13.312 13.312 0 0 1-.205-25.613l67.448-37.861a54.613 54.613 0 0 1 47.022-.546l74.943 40.059a12.97 12.97 0 0 1 .014 25.19zm-116.381-117.65-26.816-30.038-39.908 5.01 20.261-34.679-17.135-36.427 39.336 8.56 29.354-27.538 4.028 40.045 35.266 19.402-36.864 16.193zm21.722-167.445-31.799-24.699-38.393 12.151 13.654-37.847-23.43-32.768 40.237 1.366 23.907-32.386 11.182 38.666 38.23 12.725-33.288 22.556zM353.621 790.8a39.84 39.84 0 0 1-55.05 10.39l-17.312-11.85a39.595 39.595 0 0 1-10.39-54.874l213.947-312.456a39.827 39.827 0 0 1 55.05-10.39l17.354 11.837a39.595 39.595 0 0 1 10.363 54.887zm187.42-343.927-14.159-9.558-3.14-2.184a11.018 11.018 0 0 0-15.428 2.908l-28.18 41.192 35.607 24.235 28.167-41.179a11.168 11.168 0 0 0-2.895-15.428zm9.038-123.768-19.865-3.25-13.954 14.514-3.031-19.88-18.077-8.833 17.981-9.052 2.73-19.88 14.16 14.296 19.81-3.536-9.216 17.885zM441.81 428.715l-100.885-19.798-73.523 71.858-12.288-102.004-91.068-47.719 93.252-43.294 17.258-101.322 69.987 75.285 101.73-14.91-50.025 89.771zm-22.283-164.346-80.254 12.78-53.59-53.507-15.483 74.137-74.137 33.287 70.683 33.041 7.783 74.07 59.16-53.74 78.93 12.52-34.134-66.26zm185.153 385.257 65.194 32.058a50.681 50.681 0 0 1 23.607 42.42V803.8c0 16.93-10.404 24.945-23.088 17.75l-66.218-37.383a54.682 54.682 0 0 1-23.088-43.855v-71.434c-.014-16.971 10.622-25.628 23.593-19.251zm187.214 306.107v-27.306H901.12v-13.654h-13.653V901.12h-13.654v-13.653H860.16v-13.654h-13.653V860.16h-13.654v-13.653H819.2v-13.654h-13.653V819.2h-13.654v-13.653h13.654v-13.654H819.2v13.654h13.653V819.2h13.654v13.653h13.653v13.654h13.653v13.653h13.654v13.653h13.653v13.654h13.653v13.653h13.654V791.893h27.306v163.84h-163.84zm70.315-68.266zm-2.048 0z"/></svg>`,
          handler: {
            type: "action",
            async click() {
              try {
                const formattedMarkdown = await prettier.format(
                  addSpaceBetweenChineseAndEnglish(value),
                  {
                    arrowParens: "always",
                    bracketSpacing: true,
                    endOfLine: "lf",
                    htmlWhitespaceSensitivity: "css",
                    insertPragma: false,
                    singleAttributePerLine: false,
                    bracketSameLine: false,
                    jsxBracketSameLine: false,
                    jsxSingleQuote: false,
                    printWidth: 80,
                    proseWrap: "preserve",
                    quoteProps: "as-needed",
                    requirePragma: false,
                    semi: true,
                    singleQuote: false,
                    tabWidth: 2,
                    trailingComma: "es5",
                    useTabs: false,
                    embeddedLanguageFormatting: "auto",
                    vueIndentScriptAndStyle: false,
                    parser: "markdown",
                    plugins: [pluginMarkdown, pluginBabel, pluginEstree],
                  }
                );

                setValue(formattedMarkdown);
              } catch (error) {
                console.error("Error formatting markdown:", error);
              }
            },
          },
        },
      ],
    },
  ];

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
                url: location.origin + r.name,
                alt: "",
              }))
          );
        }}
      />
    </div>
  );
};
