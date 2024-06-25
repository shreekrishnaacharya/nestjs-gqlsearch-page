import {
  SK_IS_RELATIONAL,
  SK_IS_SELECT,
  SK_IS_SORT,
  SK_PAGE_SEARCH,
} from "../constants";
import { IPageSearch, ISelectColumn, ISortColumn } from "../interfaces";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { GraphQLResolveInfo } from "graphql";

export function PageSearch(options?: IPageSearch) {
  return (target: any, propertyKey: string) => {
    const optionsList: IPageSearch = {
      column: propertyKey,
      is_nested: false,
      operation: "like",
      operator: "or",
      value: null,
      ...options,
    };
    Reflect.defineMetadata(SK_PAGE_SEARCH, optionsList, target, propertyKey);
  };
}

export function SelectColumn(options?: ISelectColumn) {
  return (target: any, propertyKey: string) => {
    const optionsList: ISelectColumn = {
      column: propertyKey,
      ...options,
    };
    Reflect.defineMetadata(SK_IS_SELECT, optionsList, target, propertyKey);
  };
}

export function SortColumn(options?: ISortColumn) {
  return (target: any, propertyKey: string) => {
    const optionsList: ISortColumn = {
      column: propertyKey,
      ...options,
    };
    Reflect.defineMetadata(SK_IS_SORT, optionsList, target, propertyKey);
  };
}

export const GqlFields = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const info: GraphQLResolveInfo = gqlCtx.getInfo();
    const node = info.fieldNodes[0];
    const result = getNodeData(node);
    if (data) {
      if (data in result) {
        return result[data];
      }
    }
    return result;
  }
);

const getNodeData = (node) => {
  const { selectionSet } = node || {};
  let fields = null;
  if (!!selectionSet) {
    fields = {};
    selectionSet.selections.forEach((selection) => {
      const name = selection.name.value;
      fields[name] = getNodeData(selection);
    });
  }
  return fields == null ? true : fields;
};
