import {
  FindOptionsWhere,
  FindOptionsOrder,
  FindManyOptions,
  Like,
  Equal,
  MoreThan,
  MoreThanOrEqual,
  LessThan,
  LessThanOrEqual,
  Not,
  In,
  Between,
} from "typeorm";

import { Page } from "../models/page.model";
import { Operation, SK_PAGE_SEARCH, SK_IS_SELECT } from "../constants";
import {
  IFindAllByPage,
  IFindOne,
  IFindOptionByPage,
  IGqlPage,
  IPageSearch,
} from "../interfaces";

type TWhere = { [key: string]: Array<any> };

interface IBuildReturn {
  where: Array<TWhere>;
  relations: object;
  select?: object | Array<string>;
}

export async function findAllByPage<T>({
  repo,
  queryDto,
  sort,
  gqlPage,
  selectDto,
  customQuery,
}: IFindAllByPage<T>): Promise<Page<T>> {
  const options: FindManyOptions<T> = findOptions<T>({
    queryDto,
    sort,
    gqlPage,
    selectDto,
    customQuery,
  });
  const result = await repo.findAndCount(options);
  const nodes: T[] = result[0];
  const totalCount: number = result[1];
  return _generatePageResult<T>(nodes, totalCount, gqlPage);
}

export function findOptions<T>({
  queryDto,
  sort,
  gqlPage,
  selectDto,
  customQuery,
}: IFindOptionByPage): FindManyOptions {
  if (
    gqlPage == undefined &&
    queryDto == undefined &&
    customQuery == undefined &&
    selectDto == undefined
  ) {
    throw new Error(
      "One of gqlPage|queryDto|selectDto|customQuery must be defined"
    );
  }

  let pageable = { skip: undefined, take: undefined };
  let whereCondition = { and: [], or: [] } as TWhere;
  let sortRaw = undefined;
  if (sort) {
    sortRaw = {};
    sort.forEach((e) => {
      if (e.field.includes(".")) {
        const list = e.field.split(".");
        const key = list.shift();
        sortRaw[key] = _gqlSort(list, e.direction);
      } else {
        sortRaw[e.field] = e.direction;
      }
    });
  }
  if (gqlPage) {
    pageable = {
      skip: gqlPage.offset,
      take: gqlPage.limit,
    };
  }

  const {
    where: whereRaw,
    relations,
    select,
  } = _getMetaQuery(whereCondition, customQuery, queryDto, selectDto);
  select["id"] = true;
  return {
    select,
    where: whereRaw as unknown as FindOptionsWhere<T>,
    order: sortRaw,
    relations: relations,
    skip: pageable.skip,
    take: pageable.take,
  };
}

export async function findOne<T>({
  id,
  repo,
  queryDto,
  selectDto,
  customQuery,
}: IFindOne): Promise<T> {
  if (
    id == undefined &&
    queryDto == undefined &&
    customQuery == undefined &&
    selectDto == undefined
  ) {
    throw new Error("One of id|queryDto|selectDto|customQuery must be defined");
  }
  const cQ = customQuery ?? [];
  if (id) {
    cQ.push({ column: "id", value: id, operation: "eq", operator: "and" });
  }
  const options: FindManyOptions<T> = findOptions<T>({
    queryDto,
    selectDto,
    customQuery: cQ,
  });
  return await repo.findOne(options);
}

async function _generatePageResult<T>(
  nodes: T[],
  totalCount: number,
  pageable: IGqlPage
): Promise<Page<T>> {
  return {
    nodes,
    totalCount,
    pageable,
  } as Page<T>;
}

function _getMetaQuery(
  whereConditions: TWhere,
  conditions?: IPageSearch[],
  whereQuery?: Object,
  selectDto?: Object
): IBuildReturn {
  let relational = {};
  for (const key in whereQuery) {
    const pageSearch: IPageSearch = Reflect.getMetadata(
      SK_PAGE_SEARCH,
      whereQuery,
      key
    );
    if (pageSearch) {
      if (pageSearch.column?.includes(".")) {
        pageSearch.is_nested = pageSearch?.is_nested ?? true;
      }
      pageSearch.value = whereQuery[key];
      if (pageSearch.value.toString() == "") {
        continue;
      }
      _buildWhere(pageSearch, whereConditions);
    }
  }
  for (const skey in selectDto) {
    if (isObject(selectDto[skey])) {
      relational[skey] = _buildRelation(selectDto[skey]);
    }
  }
  conditions?.forEach((pageSearch: IPageSearch) => {
    if (pageSearch.column?.includes(".")) {
      pageSearch.is_nested = pageSearch?.is_nested ?? true;
    }
    _buildWhere(pageSearch, whereConditions);
  });
  let whereArray: Array<TWhere> = [];
  whereConditions.or.forEach((element) => {
    whereArray.push(element);
  });
  if (whereArray.length == 0) {
    whereConditions.and.forEach((ele, i) => {
      whereArray[0] = {
        ...whereArray[0],
        ...ele,
      };
    });
  } else if (whereConditions.and.length > 0) {
    let andWhere = {};
    whereConditions.and.forEach((ele, i) => {
      andWhere = {
        ...andWhere,
        ...ele,
      };
    });
    whereArray = whereArray.map((element, i) => {
      return { ...element, ...andWhere };
    });
  }

  return {
    where: [...whereArray],
    relations: { ...relational },
    select: { ...selectDto },
  };
}

function _recursiveNestedObject(column: Array<string>, value: any) {
  if (column.length == 1) {
    const [key] = column;
    return { [key]: value };
  }
  const [key, ...rest] = column;
  return { [key]: _recursiveNestedObject(rest, value) };
}

function _buildWhere(pageSearch: IPageSearch, whereConditions: TWhere) {
  let cond = {};
  let { column, is_nested, operation, operator, value } = pageSearch;
  if (!column) {
    return whereConditions;
  }
  if (!operation && Array.isArray(value)) {
    operation = "in";
  }
  if (operation == "in" && !Array.isArray(value)) {
    value = [value];
  }
  if (operation == "between" && !Array.isArray(value)) {
    return;
  }
  if (operation == "between" && Array.isArray(value) && value.length < 2) {
    return;
  }
  if (is_nested) {
    const nested = column.split(".");
    const nestValue = _switchContition(operation ?? "like", value);
    cond = _recursiveNestedObject(nested, nestValue);
  } else {
    cond[column] = _switchContition(operation ?? "like", value);
  }
  whereConditions[operator ?? "or"].push(cond);
}

function _buildRelation(select: {}, relation = {}) {
  let isobject = false;
  for (const skey in select) {
    if (isObject(select[skey])) {
      relation[skey] = _buildRelation(select[skey], relation);
      isobject = true;
    }
  }
  return isobject ? relation : true;
}

function _switchContition(operation: Operation, value: any) {
  switch (operation) {
    case "gt":
      return MoreThan(value);
    case "gteq":
      return MoreThanOrEqual(value);
    case "in":
      return In(value);
    case "like":
      return Like(`%${value}%`);
    case "lt":
      return LessThan(value);
    case "lteq":
      return LessThanOrEqual(value);
    case "neq":
      return Not(Equal(value));
    case "between":
      return Between(value[0], value[1]);
    default:
      return value;
  }
}

function _gqlSort(sort: Array<string>, value: string) {
  const key = sort.shift();
  if (sort.length == 0) {
    return {
      [key]: value,
    };
  }
  return {
    [key]: _gqlSort(sort, value),
  };
}
function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
