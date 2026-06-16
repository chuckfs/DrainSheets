export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function actionError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

export function actionSuccess<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}
