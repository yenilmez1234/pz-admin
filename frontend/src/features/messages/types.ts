export interface MessageDocument {
  lines: MessageLine[];
}

export interface MessageLine {
  color: string | null;
  id: string;
  text: string;
}
