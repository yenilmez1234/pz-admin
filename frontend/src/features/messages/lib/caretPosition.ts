let measurementContext: CanvasRenderingContext2D | null | undefined;

export function measureCaretX(
  input: HTMLTextAreaElement,
  position: number,
): number {
  const measure = createTextMeasurer(input);
  return measure(input.value.slice(0, position));
}

export function closestCaretPosition(
  input: HTMLTextAreaElement,
  targetX: number,
): number {
  const measure = createTextMeasurer(input);
  let previousPosition = 0;
  let previousWidth = 0;
  let position = 0;

  for (const character of input.value) {
    position += character.length;
    const width = measure(input.value.slice(0, position));
    if (width >= targetX) {
      return targetX - previousWidth <= width - targetX
        ? previousPosition
        : position;
    }
    previousPosition = position;
    previousWidth = width;
  }

  return input.value.length;
}

function createTextMeasurer(input: HTMLTextAreaElement) {
  const context = getMeasurementContext();
  if (!context) return (text: string) => text.length;

  const style = getComputedStyle(input);
  context.font = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ].join(" ");

  return (text: string) => context.measureText(text).width;
}

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (measurementContext !== undefined) return measurementContext;
  measurementContext = document.createElement("canvas").getContext("2d");
  return measurementContext;
}
