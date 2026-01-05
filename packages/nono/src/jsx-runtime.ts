export type NonoNode = {
  type: string;
  props: Record<string, unknown>;
  children: NonoNode[];
};

export function jsx(
  type: ((...args: unknown[]) => NonoNode) | string,
  props: Record<string, unknown> | null
): NonoNode {
  const { children, ...rest } = props ?? {};
  const childArray = children
    ? Array.isArray(children)
      ? children
      : [children]
    : [];

  return {
    type: typeof type === "function" ? type.name : type,
    props: rest,
    children: childArray.filter((c): c is NonoNode => c != null),
  };
}

export const jsxs = jsx;

export function Fragment({ children }: { children?: NonoNode[] }): NonoNode {
  return {
    type: "Fragment",
    props: {},
    children: children ?? [],
  };
}
