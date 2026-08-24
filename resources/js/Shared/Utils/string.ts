export function ucfirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const USER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6'];

export function colorFromString(value: string, palette: readonly string[]): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

export function textColorForBg(hex: string): string {
    const color = hex.replace('#', '');
    const red = parseInt(color.substring(0, 2), 16) / 255;
    const green = parseInt(color.substring(2, 4), 16) / 255;
    const blue = parseInt(color.substring(4, 6), 16) / 255;
    const toLinear = (value: number) => (
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
    const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
    return luminance > 0.4 ? '#000' : '#fff';
}

export function userColor(name: string): string {
    return colorFromString(name, USER_COLORS);
}
