export function capDefault(value: number, max: number): number {
    return max > 0
        ? value === 0 ? max : Math.min(value, max)
        : value;
}
