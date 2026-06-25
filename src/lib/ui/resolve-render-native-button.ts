import * as React from "react";

function isButtonLikeComponent(type: unknown) {
  if (typeof type !== "function") {
    return false;
  }

  const named = type as { displayName?: string; name?: string };
  return named.displayName === "Button" || named.name === "Button";
}

/** Base UI `nativeButton` must be true when `render` is a `<button>` or `Button`. */
export function resolveRenderNativeButton(
  render: unknown,
  nativeButton?: boolean,
): boolean | undefined {
  if (nativeButton !== undefined) {
    return nativeButton;
  }

  if (render == null) {
    return undefined;
  }

  if (typeof render === "function") {
    return false;
  }

  if (!React.isValidElement(render)) {
    return false;
  }

  if (render.type === "button" || isButtonLikeComponent(render.type)) {
    return true;
  }

  return false;
}
