import { colorBlock } from './colors.mjs';

export function render(value) {
  try {
    switch (value.type) {
      case 'number':
        return String(value.data);

      case 'text':
        return value.data;

      case 'emoji':
        return value.data;

      case 'color':
        return colorBlock(value.data.rgb);

      case 'colored_blocks': {
        const count = Math.max(0, Math.min(value.data.count, 1000));
        const block = colorBlock(value.data.color.rgb);
        return block.repeat(count);
      }

      case 'list':
        return value.data.map(v => render(v)).join('');

      default:
        return String(value.data ?? '');
    }
  } catch {
    return String(value?.data ?? '');
  }
}
