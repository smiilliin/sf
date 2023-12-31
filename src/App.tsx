import React, { useEffect, useRef, useState } from "react";
import Sf from "./sf";

function App() {
  const [src, setSrc] = useState(
    'bg "white";\ncstart "title";\n img "./react.png" alt="icon", float="left", height="150px", mright="10px";\n big "SF" color="white", blend="difference";\n middle "simple format" color="white", blend="difference";\n a "by smiilliin" href="https://github.com/smiilliin", underline=false, newtab=true, color="gray", blend="difference";\n divider "1px solid gray" blend="difference";\ncend "title";\ncstart "body";\n "Quaestio VIII.\nPropositum quadratum dividere in duos quadratos.\nImperatum sit ut 16. dividatur in duos quadratos. Ponatur primus 1Q. Oportet igitur 16. - 1Q. aequales esse quadrato. Fingo quadratum a numeris quotquot libuerit, cum defectu tot unitatum quod continet latus ipsius 16. esto a 2N. - 4. ipse igitur quadratus erit 4Q. + 16. - 16N. haec aequabuntur unitatibus 16. - 1Q. Communis adiiciatur utrimque defectus, et a similibus auferantur similia, fient 5Q. aequales 16N. et fit 1N. 16/5. Erit igitur alter quadratorum 256/25. alter vero 144/25. et utriusque summa est 400/25. seu 16. et uterque quadratus est." color="white", mtop="10px", blend="difference";\ncend "body";'
  );
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    const backgroundColor = getComputedStyle(
      textareaRef.current
    ).getPropertyValue("background-color");

    const rgbBackgroundColor = backgroundColor.match(/\d+/g);
    if (!rgbBackgroundColor) return;
    const r = Number(rgbBackgroundColor[0]);
    const g = Number(rgbBackgroundColor[1]);
    const b = Number(rgbBackgroundColor[2]);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    const adjustedTextColor = luminance > 0.5 ? "#000000" : "#ffffff";
    textareaRef.current.style.color = adjustedTextColor;
  }, [backgroundColor]);

  return (
    <div className="App" style={{ backgroundColor: backgroundColor }}>
      <Sf
        src={src}
        style={{ overflowY: "auto" }}
        setBackgroundColor={setBackgroundColor}
      ></Sf>
      <textarea
        className="Input"
        defaultValue={src}
        spellCheck={false}
        style={{ backgroundColor: backgroundColor, tabSize: 2 }}
        ref={textareaRef}
        onChange={(event) => {
          setSrc(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key == "Tab") {
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            target.setRangeText("\t", start, end, "end");
            setSrc(target.value);
          }
        }}
        onPaste={(event) => {
          if (window.confirm("Do you want to use double quotes?")) {
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            const clipboardData = event.clipboardData
              .getData("text")
              .replaceAll("\\", "\\\\")
              .replaceAll('"', '\\"');

            target.setRangeText(clipboardData, start, end, "end");
            setSrc(target.value);
          }
        }}
      ></textarea>
    </div>
  );
}

export default App;
