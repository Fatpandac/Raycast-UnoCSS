export function rgbToHex(rgb: string) {
  const regex = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/;
  const match = rgb.match(regex);
  if (!match?.filter((i) => i !== null).length) return;

  const r = match[1];
  const g = match[2];
  const b = match[3];
  const red = parseInt(r).toString(16).padStart(2, "0");
  const green = parseInt(g).toString(16).padStart(2, "0");
  const blue = parseInt(b).toString(16).padStart(2, "0");

  return `#${red}${green}${blue}`;
}
