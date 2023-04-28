export type KeyWithValueType<T, V> = {
  [Key in keyof T]-?: T[Key] extends V ? Key : never;
}[keyof T];
