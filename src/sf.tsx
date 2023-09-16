import React, { useState } from "react";
import { useEffect } from "react";
import Prism from "prismjs";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-go-module";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-http";
import "prismjs/components/prism-java";
import "prismjs/components/prism-objectivec";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism-tomorrow.css";

type ValueType = string | number | boolean;
interface ICommand {
  tag: string;
  data: string;
  options: Map<string, ValueType>;
}
const getKeyFromCommand = (commandIndex: number, command: ICommand) => {
  const key: { [key: string]: ValueType } = {};

  const optionsEntries = Array.from(command.options.entries());
  for (let i = 0; i < optionsEntries.length; i++) {
    const option = optionsEntries[i];
    key[option[0]] = option[1];
  }
  const encoder = new TextEncoder();

  return [
    commandIndex.toString(),
    command.tag,
    crypto.subtle.digest("SHA-1", encoder.encode(command.data)),
    JSON.stringify(key),
  ].join(";");
};

enum KeysType {
  NumberType = 1 << 0,
  StringType = 1 << 1,
  BooleanType = 1 << 2,
  Everything = NumberType | StringType | BooleanType,
  NS = NumberType | StringType,
  SB = StringType | BooleanType,
  BN = BooleanType | NumberType,
}

type BindKeys = { [key: string]: Array<string | KeysType> };
const baseKeys: BindKeys = {
  mtop: ["marginTop", KeysType.NS],
  mbottom: ["marginBottom", KeysType.NS],
  mleft: ["marginLeft", KeysType.NS],
  mright: ["marginRight", KeysType.NS],
  ptop: ["paddingTop", KeysType.NS],
  pbottom: ["paddingBottom", KeysType.NS],
  pleft: ["paddingLeft", KeysType.NS],
  pright: ["paddingRight", KeysType.NS],
  border: ["border", KeysType.StringType],
  bradius: ["borderRadius", KeysType.NS],
  color: ["color", KeysType.StringType],
  cursor: ["cursor", KeysType.StringType],
  blend: ["mixBlendMode", KeysType.StringType],
  width: ["width", KeysType.NS],
  height: ["height", KeysType.NS],
  mwidth: ["maxWidth", KeysType.NS],
  mheight: ["maxHeight", KeysType.NS],
  display: ["display", KeysType.StringType],
  position: ["position", KeysType.StringType],
  float: ["float", KeysType.StringType],
  wordwrap: ["wordWrap", KeysType.StringType],
  wordbreak: ["wordBreak", KeysType.StringType],
  size: ["fontSize", KeysType.NS],
  weight: ["fontWeight", KeysType.NS],
  family: ["fontFamily", KeysType.StringType],
};

const bindOptions = (
  toBind: BindKeys,
  options: Map<string, ValueType>,
  result: any,
  filter?: (key: string, value: ValueType, bindKey: string) => any
) => {
  Array.from(options.entries()).forEach(([optionKey, optionValue]) => {
    const bindKeys = toBind[optionKey as keyof typeof toBind];

    if (!bindKeys) return;
    if (bindKeys.length < 2) throw Error("bind key length is unavailable");
    const keyType = bindKeys.at(-1) as KeysType;

    if (
      bindKeys &&
      (keyType === KeysType.Everything ||
        (typeof optionValue == "number" &&
          (keyType & KeysType.NumberType) !== 0) ||
        (typeof optionValue == "string" &&
          (keyType & KeysType.StringType) !== 0) ||
        (typeof optionValue == "boolean" &&
          (keyType & KeysType.BooleanType) !== 0))
    ) {
      for (let i = 0; i < bindKeys.length - 1; i++) {
        const bindKey = bindKeys[i] as string;
        if (typeof bindKey != "string") throw Error("key is unavailable");

        if (filter) {
          const filteredData = filter(optionKey, optionValue, bindKey);

          if (filteredData !== undefined) {
            result[bindKey] = filteredData;
          }
        } else {
          result[bindKey] = optionValue;
        }
      }
    }
  });
  return result;
};

enum TextFormatTypeEnum {
  None = 0,
  Bold = 1 << 0,
  Italic = 1 << 1,
  Underline = 1 << 2,
}

interface IETextFormatContainer {
  data: string;
  formatStyle: React.CSSProperties;
  type: TextFormatTypeEnum;
}
const TextFormatContainer = ({
  data,
  formatStyle,
  type,
}: IETextFormatContainer) => {
  interface IFound {
    data: string;
    index: number;
    length: number;
  }
  const findFormat = (
    data: string,
    squenceName: string,
    end: number
  ): IFound | null => {
    const pattern = new RegExp(
      `(^|[^\\\\])(?:\\\\\\\\)*(?:\\\\${squenceName})`,
      "g"
    );
    const newData = data.slice(end);

    const patternResults: Array<RegExpExecArray> = [];
    let patternResult: RegExpExecArray | null;
    while ((patternResult = pattern.exec(newData))) {
      if (patternResult[1] !== "") {
        patternResult.index++;
        patternResult.length--;
      }
      if (patternResults.length !== 0) {
        patternResults[1] = patternResult;
      } else {
        patternResults[0] = patternResult;
      }
    }

    if (patternResults.length === 2) {
      const startIndex = patternResults[0].index + 2;
      const endIndex = patternResults[1].index - 1;

      return {
        data: newData.slice(startIndex, endIndex + 1),
        index: startIndex,
        length: endIndex - startIndex + 1,
      };
    }

    return null;
  };

  const textFormatComponents: Array<JSX.Element> = [];

  let boldData: IFound | null = null;
  let italicData: IFound | null = null;
  let underlineData: IFound | null = null;

  let shouldLoadBold = true;
  let shouldLoadItalic = true;
  let shouldLoadUnderline = true;

  let lastDataEnd = 0;

  while (true) {
    if (shouldLoadBold) {
      boldData = findFormat(
        data,
        "B",
        boldData ? boldData.index + boldData.length + 2 : 0
      );
      shouldLoadBold = false;
    }
    if (shouldLoadItalic) {
      italicData = findFormat(
        data,
        "I",
        italicData ? italicData.index + italicData.length + 2 : 0
      );
      shouldLoadItalic = false;
    }
    if (shouldLoadUnderline) {
      underlineData = findFormat(
        data,
        "U",
        underlineData ? underlineData.index + underlineData.length + 2 : 0
      );
      shouldLoadUnderline = false;
    }

    let minDataIndex: number | null = Math.min(
      boldData?.index || Number.MAX_SAFE_INTEGER,
      italicData?.index || Number.MAX_SAFE_INTEGER,
      underlineData?.index || Number.MAX_SAFE_INTEGER
    );
    if (minDataIndex === Number.MAX_SAFE_INTEGER) minDataIndex = null;

    let minDataType = TextFormatTypeEnum.None;
    let minData: string | undefined;
    if (minDataIndex === boldData?.index) {
      minDataType = TextFormatTypeEnum.Bold;
      minData = boldData.data;
    }
    if (minDataIndex === italicData?.index) {
      minDataType = TextFormatTypeEnum.Italic;
      minData = italicData.data;
    }
    if (minDataIndex === underlineData?.index) {
      minDataType = TextFormatTypeEnum.Underline;
      minData = underlineData.data;
    }
    const minDataLength: number | null =
      minData?.length == null ? null : minData.length;

    if (minDataIndex == null) {
      if (textFormatComponents.length == 0) {
        if (data) {
          return (
            <TextFormatRenderer
              data={data}
              type={type}
              formatStyle={formatStyle}
              key={0 + data}
            ></TextFormatRenderer>
          );
        } else {
          return <></>;
        }
      } else {
        const textData = data.slice(lastDataEnd);

        if (textData) {
          textFormatComponents.push(
            <TextFormatRenderer
              data={textData}
              type={type}
              formatStyle={formatStyle}
              key={textFormatComponents.length + textData}
            ></TextFormatRenderer>
          );
        }
      }

      break;
    } else {
      if (minDataIndex - 2 > lastDataEnd) {
        const textData = data.slice(lastDataEnd, minDataIndex - 2);

        textFormatComponents.push(
          <TextFormatRenderer
            data={textData}
            type={type}
            formatStyle={formatStyle}
            key={textFormatComponents.length + textData}
          ></TextFormatRenderer>
        );
      }

      if (minData != null) {
        textFormatComponents.push(
          <TextFormatContainer
            data={minData}
            formatStyle={formatStyle}
            type={type | minDataType}
            key={textFormatComponents.length + minData}
          ></TextFormatContainer>
        );
      }
      if (minDataLength != null) {
        lastDataEnd = minDataIndex + minDataLength + 2;
      }

      const updateData = (data: IFound | null, squence: string) => {
        while (data && lastDataEnd > data.index + data.length + 2) {
          data = findFormat(
            data.data,
            squence,
            data ? data.index + data.length + 2 : 0
          );
        }
        return data;
      };
      if (minDataType == TextFormatTypeEnum.Bold) {
        shouldLoadBold = true;
        italicData = updateData(italicData, "I");
        underlineData = updateData(underlineData, "U");
      }
      if (minDataType == TextFormatTypeEnum.Italic) {
        shouldLoadItalic = true;
        boldData = updateData(boldData, "B");
        underlineData = updateData(underlineData, "U");
      }
      if (minDataType == TextFormatTypeEnum.Underline) {
        shouldLoadUnderline = true;
        boldData = updateData(boldData, "B");
        italicData = updateData(italicData, "I");
      }
    }

    if (textFormatComponents.length > 100) {
      throw new Error("too many textFormatComponents");
    }
  }

  return <>{textFormatComponents}</>;
};
interface IETextFormatRenderer {
  data: string;
  type: TextFormatTypeEnum;
  formatStyle: React.CSSProperties;
}
const TextFormatRenderer = ({
  data,
  type,
  formatStyle: _formatStyle,
}: IETextFormatRenderer) => {
  const formatStyle = { ..._formatStyle };

  if ((type & TextFormatTypeEnum.Bold) !== 0) {
    formatStyle.fontWeight = "bold";
  }
  if ((type & TextFormatTypeEnum.Italic) !== 0) {
    formatStyle.fontStyle = "italic";
  }
  if ((type & TextFormatTypeEnum.Underline) !== 0) {
    formatStyle.textDecoration = "underline";
  }
  formatStyle.whiteSpace = "pre-wrap";

  return <span style={formatStyle}>{data}</span>;
};
interface IETextFormat {
  data: string;
  commandStyle: React.CSSProperties;
}
const TextFormat = ({ commandStyle, data }: IETextFormat) => {
  const formatStyle = { ...commandStyle };

  delete formatStyle.marginTop;
  delete formatStyle.marginBottom;
  delete formatStyle.marginLeft;
  delete formatStyle.marginRight;
  delete formatStyle.paddingTop;
  delete formatStyle.paddingBottom;
  delete formatStyle.paddingLeft;
  delete formatStyle.paddingRight;
  delete formatStyle.border;

  return (
    <div style={commandStyle}>
      <TextFormatContainer
        formatStyle={formatStyle}
        data={data}
        type={TextFormatTypeEnum.None}
      ></TextFormatContainer>
    </div>
  );
};

interface IECommand {
  command: ICommand;
}
const Command = ({ command }: IECommand) => {
  const { tag, data, options } = command;

  let props = {};
  let commandStyle: React.CSSProperties = {};
  switch (tag) {
    case "img": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      props = bindOptions(
        { alt: ["alt", KeysType.StringType] },
        options,
        props
      );
      return <img alt="" {...props} style={commandStyle} src={data}></img>;
    }
    case "a":
    case "link": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      commandStyle = bindOptions(
        {
          underline: ["textDecoration", KeysType.BooleanType],
        },
        options,
        commandStyle,
        (key, value) => {
          switch (key) {
            case "underline": {
              return value ? undefined : "none";
            }
            default: {
              return value;
            }
          }
        }
      );
      props = bindOptions(
        {
          href: ["href", KeysType.StringType],
          newtab: ["target", "rel", KeysType.BooleanType],
        },
        options,
        props,
        (key, value, bindKey) => {
          switch (key) {
            case "newtab": {
              if (value) {
                switch (bindKey) {
                  case "target": {
                    return "_blank";
                  }
                  case "rel": {
                    return "noopener noreferrer";
                  }
                  default: {
                    return undefined;
                  }
                }
              }
              return undefined;
            }
            default: {
              return value;
            }
          }
        }
      );
      return (
        <a style={commandStyle} {...props}>
          {data}
        </a>
      );
    }
    case "span": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <span style={commandStyle}>{data}</span>;
    }
    case "format": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <TextFormat data={data} commandStyle={commandStyle}></TextFormat>;
    }
    case "p": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <p style={commandStyle}>{data}</p>;
    }
    case "big": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <h1 style={commandStyle}>{data}</h1>;
    }
    case "middle": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <h2 style={commandStyle}>{data}</h2>;
    }
    case "small": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <h3 style={commandStyle}>{data}</h3>;
    }
    case "divider": {
      commandStyle = {
        borderTop: data,
        marginTop: 10,
        marginBottom: 5,
        width: "100%",
      };
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      return <div style={commandStyle}></div>;
    }
    case "code": {
      commandStyle = bindOptions(baseKeys, options, commandStyle);
      commandStyle = {
        margin: 0,
        ...commandStyle,
      };
      const lang = options.get("lang");

      return (
        <pre style={commandStyle}>
          <code
            className={`language-${lang}`}
            style={{
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              wordWrap: "break-word",
            }}
          >
            {data}
          </code>
        </pre>
      );
    }
    default: {
      return <></>;
    }
  }
};

interface IESf {
  src?: string;
  setBackgroundColor?: React.Dispatch<React.SetStateAction<string>>;
  style?: React.CSSProperties;
  commands?: Array<ICommand>;
}
const Sf = ({ src, setBackgroundColor, style, commands }: IESf) => {
  const commandPattern = /(?:[^\n]|\\\n)*?"(?:[^"\\]|\\.|;)*"[^;]*;/g;
  const optionPattern = /([^,\s=]*)=([^,]*)/g;
  const commandParsePattern =
    /^(\s*?[^\s]*?)[\s\n\\]*"((?:[^"\\]|\\.)*)"(?:[\s\n\\]*(.*))?;/;
  const valueParsePattern = /"((?:[^"\\]|\\.)*)"/;

  enum SfElementTypeEnum {
    command,
    container,
    containerCommand,
  }
  interface SfElement {
    type: SfElementTypeEnum;
    data: ICommand | Array<ICommand>;
  }

  const getKeyFromSfElement = (index: number, element: SfElement): string => {
    if (element.type == SfElementTypeEnum.command) {
      return index + (element.data as ICommand).data;
    } else {
      return (element.data as Array<ICommand>)
        .map((command, index) => getKeyFromCommand(index, command))
        .join(";");
    }
  };

  const [elements, setElements] = useState<Array<SfElement>>([]);

  useEffect(() => {
    const newElements: Array<SfElement> = [];

    let containerCommands: Array<ICommand> = [];
    let containerSquence: string | null = null;

    const processElement = (command: ICommand) => {
      const { tag, data } = command;

      if (tag == "cstart" && containerSquence == null) {
        containerSquence = data;
        newElements.push({
          type: SfElementTypeEnum.containerCommand,
          data: command,
        });
      } else if (tag == "cend" && command.data == containerSquence) {
        containerSquence = null;
        newElements.push({
          type: SfElementTypeEnum.container,
          data: containerCommands,
        });
        containerCommands = [];
      } else {
        if (containerSquence != null) {
          containerCommands.push(command);
        } else {
          newElements.push({
            type: SfElementTypeEnum.command,
            data: command,
          });
        }
      }
    };

    if (!commands) {
      commands = [];

      if (src == undefined) {
        throw new Error("src is not defined");
      }
      let commandRaw;

      while ((commandRaw = commandPattern.exec(src))) {
        commandRaw = commandRaw[0];

        const [, _tag, _data, optionsRaw] =
          commandParsePattern.exec(commandRaw) || [];
        const tag = (_tag || "format").trimStart();
        const replaceNewline = (data: string) => {
          let newData = "";

          const pattern = new RegExp(`(^|[^\\\\])(?:\\\\\\\\)*(?:\\\\n)`, "g");
          let patternResult: RegExpExecArray | null = null;
          let lastEnd = 0;
          while ((patternResult = pattern.exec(data))) {
            if (patternResult[1] !== "") {
              patternResult.index++;
              patternResult.length--;
            }

            const nowEnd = patternResult.index + patternResult.length;
            newData += data.slice(lastEnd, nowEnd - 1) + "\n";

            lastEnd = nowEnd;
          }
          newData += data.slice(lastEnd);
          return newData;
        };

        const data = replaceNewline(_data?.replaceAll('\\"', '"')).replaceAll(
          "\\\\",
          "\\"
        );

        if (setBackgroundColor && tag === "bg") {
          setBackgroundColor(data);
          continue;
        }

        let option;
        const options = new Map<string, ValueType>();
        while ((option = optionPattern.exec(optionsRaw))) {
          const [, key, valueRaw] = option;
          const valueParseData = valueParsePattern.exec(valueRaw);

          let value: ValueType;
          if (valueParseData) {
            value = valueParseData[1];
          } else {
            if (valueRaw === "true" || valueRaw === "t" || valueRaw === "T") {
              value = true;
            } else if (
              valueRaw === "false" ||
              valueRaw === "f" ||
              valueRaw === "F"
            ) {
              value = false;
            } else {
              value = Number(valueRaw);
            }
          }
          options.set(key, value);
        }

        const command: ICommand = {
          tag: tag || "",
          data: data || "",
          options: options,
        };
        processElement(command);

        if (commands.length > 100) {
          throw new Error("too many commands");
        }
      }
    } else {
      commands.forEach((command) => processElement(command));
    }
    setElements([...newElements]);
  }, [src, commands]);

  const containerStyle = { ...style };
  delete containerStyle.marginTop;
  delete containerStyle.marginBottom;
  delete containerStyle.marginLeft;
  delete containerStyle.marginRight;
  delete containerStyle.paddingTop;
  delete containerStyle.paddingBottom;
  delete containerStyle.paddingLeft;
  delete containerStyle.paddingRight;
  delete containerStyle.border;

  let commandStyle: React.CSSProperties = {};

  useEffect(() => {
    if (
      elements.find(
        (element) =>
          element.type == SfElementTypeEnum.command &&
          (element.data as ICommand).tag == "code"
      )
    ) {
      Prism.highlightAll();
    }
  }, [elements]);

  return (
    <div style={style}>
      {elements.map((element, index) => {
        if (element.type == SfElementTypeEnum.containerCommand) {
          commandStyle = bindOptions(
            baseKeys,
            (element.data as ICommand).options,
            commandStyle
          );
          return <React.Fragment key={index}></React.Fragment>;
        } else if (element.type == SfElementTypeEnum.container) {
          return (
            <Sf
              setBackgroundColor={setBackgroundColor}
              style={{ ...containerStyle, ...commandStyle }}
              commands={element.data as Array<ICommand>}
              key={getKeyFromSfElement(index, element)}
            ></Sf>
          );
        } else {
          return (
            <Command
              command={element.data as ICommand}
              key={getKeyFromCommand(index, element.data as ICommand)}
            ></Command>
          );
        }
      })}
    </div>
  );
};

export default Sf;
