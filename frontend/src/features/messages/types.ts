export interface MessageDocument {
  type: "doc";
  content: MessageParagraph[];
}

export interface MessageParagraph {
  type: "paragraph";
  content?: MessageText[];
}

export interface MessageText {
  type: "text";
  text: string;
  marks?: MessageMark[];
}

export interface MessageMark {
  type: "textStyle";
  attrs: {
    color?: string;
    fontSize?: string;
  };
}

export type MessageSize = "small" | "medium" | "large";
