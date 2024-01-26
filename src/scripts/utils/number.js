export class NumberUtils {
  static parseIntOrGetDefault(value, defaultValue) {
    const parsedValue = parseInt(value);
    return !isNaN(parsedValue) ? parsedValue : defaultValue;
  }
}
