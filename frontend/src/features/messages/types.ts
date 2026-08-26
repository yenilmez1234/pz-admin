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

export interface MessageTextStyleMark {
  type: "textStyle";
  attrs: MessageTextStyle;
}

export interface MessageTextStyle {
  color?: string;
  fontSize?: string;
}

export type MessageMark = MessageTextStyleMark;
export type MessageSize = "small" | "medium" | "large";
