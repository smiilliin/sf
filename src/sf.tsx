import React from "react";
import { useEffect } from "react";

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

  return (
    String(commandIndex) + command.tag + command.data + JSON.stringify(key)
  );
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

  return <span style={formatStyle}>{data.replaceAll("\\\\", "\\")}</span>;
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
    default: {
      return <></>;
    }
  }
};

interface IESf {
  src: string;
  setBackgroundColor?: React.Dispatch<React.SetStateAction<string>>;
  style?: React.CSSProperties;
}
const Sf = ({ src, setBackgroundColor, style }: IESf) => {
  const commandPattern = /(?:[^\n]|\\\n)*?"(?:[^"\\]|\\.|;)*"[^;]*;/g;
  const optionPattern = /([^,\s=]*)=([^,]*)/g;
  const commandParsePattern =
    /^([^\s]*?)[\s\n\\]*"((?:[^"\\]|\\.)*)"(?:[\s\n\\]*(.*))?;/;
  const valueParsePattern = /"((?:[^"\\]|\\.)*)"/;

  const commands = new Array<ICommand>();

  let backgroundColor: string | undefined;
  let command;
  while ((command = commandPattern.exec(src))) {
    command = command[0];

    const [, _tag, _data, optionsRaw] = commandParsePattern.exec(command) || [];
    const tag = _tag || "format";
    if (tag === "bg") backgroundColor = _data;

    const data = _data?.replaceAll("\\n", "\n")?.replaceAll('\\"', '"');

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

    commands.push({ tag: tag || "", data: data || "", options: options });
  }
  useEffect(() => {
    if (!setBackgroundColor) return;
    if (backgroundColor) setBackgroundColor(backgroundColor);
  }, [backgroundColor, setBackgroundColor]);

  return (
    <div style={style}>
      {commands.map((command, index) => (
        <Command
          command={command}
          key={getKeyFromCommand(index, command)}
        ></Command>
      ))}
    </div>
  );
};

export default Sf;
