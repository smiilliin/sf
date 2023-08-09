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

interface IECommand {
  command: ICommand;
}
const Command = ({ command }: IECommand) => {
  const { tag, data, options } = command;

  let props = {};
  let commandStyle: React.CSSProperties = {};
  const bindOptions = (
    toBind: BindKeys,
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
  switch (tag) {
    case "img": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      props = bindOptions({ alt: ["alt", KeysType.StringType] }, props);
      return <img alt="" {...props} style={commandStyle} src={data}></img>;
    }
    case "a":
    case "link": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      commandStyle = bindOptions(
        {
          underline: ["textDecoration", KeysType.BooleanType],
        },
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
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <span style={commandStyle}>{data}</span>;
    }
    case "text": {
      const useMargin = bindOptions(baseKeys, commandStyle, (key, value) => {
        switch (key) {
          case "mtop":
          case "mbottom": {
            return value;
          }
          default: {
            return undefined;
          }
        }
      });
      commandStyle = {
        marginTop: 0,
        marginBottom: 0,
      };
      commandStyle = bindOptions(baseKeys, commandStyle, (key, value) => {
        switch (key) {
          case "mtop":
          case "mbottom": {
            return undefined;
          }
          default: {
            return value;
          }
        }
      });

      return (
        <div style={useMargin}>
          {data.split("\n").map((data, index) => (
            <p key={index} style={commandStyle}>
              {data}
            </p>
          ))}
        </div>
      );
    }
    case "p": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <p style={commandStyle}>{data}</p>;
    }
    case "big": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <h1 style={commandStyle}>{data}</h1>;
    }
    case "middle": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <h2 style={commandStyle}>{data}</h2>;
    }
    case "small": {
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <h3 style={commandStyle}>{data}</h3>;
    }
    case "divider": {
      commandStyle = {
        borderTop: data,
        marginTop: 10,
        marginBottom: 5,
        width: "100%",
      };
      commandStyle = bindOptions(baseKeys, commandStyle);
      return <div style={commandStyle}></div>;
    }
    default: {
      return <></>;
    }
  }
};

const commandPattern = /(?:[^\n]|\\\n)*?"(?:[^"\\]|\\.|;)*"[^;]*;/g;
const optionPattern = /([^,\s=]*)=([^,]*)/g;
const commandParsePattern =
  /^([^\s]*?)[\s\n\\]*"((?:[^"\\]|\\.)*)"(?:[\s\n\\]*(.*))?;/;
const valueParsePattern = /"((?:[^"\\]|\\.)*)"/;

interface IESf {
  src: string;
  setBackgroundColor?: React.Dispatch<React.SetStateAction<string>>;
  style?: React.CSSProperties;
}
const Sf = ({ src, setBackgroundColor, style }: IESf) => {
  const commands = new Array<ICommand>();

  let backgroundColor: string | undefined;
  let command;
  while ((command = commandPattern.exec(src))) {
    command = command[0];

    let [, tag, data, optionsRaw] = commandParsePattern.exec(command) || [];
    tag = tag || "text";
    if (tag === "bg") backgroundColor = data;

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
