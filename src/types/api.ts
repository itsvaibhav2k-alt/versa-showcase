export interface Ok<T> {
  isOk: true;
  value: T;
}

export interface Err<E = string> {
  isOk: false;
  error: E;
}

export type Result<T, E = string> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { isOk: true, value };
}

export function err<E = string>(error: E): Err<E> {
  return { isOk: false, error };
}
