export type UpdateFunction = (
  prop: string,
  value: any,
  isUrl: boolean,
  returnOnly?: boolean,
  shouldValidate?: boolean,
  subProp?: string,
  isNumber?: boolean,
  isConfig?: boolean
) => any;
