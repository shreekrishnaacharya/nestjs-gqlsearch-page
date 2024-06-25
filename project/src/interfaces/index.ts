import { Operation, Operator, SortDirection } from "../constants";
import { Repository } from "typeorm";

export interface IPageSearch {
  column?: string;
  is_nested?: boolean;
  operation?: Operation;
  operator?: Operator;
  value?: string | number | boolean | null | Array<string | number | boolean>;
}

export interface ISelectColumn {
  column?: string;
  is_relational?: boolean;
  is_nested?: boolean;
}

export interface ISortColumn {
  column?: string;
  value?: SortDirection;
}
export interface IGqlSort {
  field: string;
  direction: SortDirection;
}

export interface IGqlPage {
  limit: number;
  offset: number;
}

export interface IPage {
  _start: number;
  _end: number;
  _sort: string;
  _order: SortDirection;
}

export interface ISortable {
  asKeyValue(): { [key: string]: string };
}

export interface IFindAllByPage<T> {
  repo: Repository<T>;
  gqlPage?: IGqlPage;
  sort?: Array<IGqlSort>;
  queryDto?: Object;
  selectDto?: Object;
  customQuery?: IPageSearch[];
}

export interface IFindOptionByPage {
  gqlPage?: IGqlPage;
  sort?: Array<IGqlSort>;
  queryDto?: Object;
  selectDto?: Object;
  customQuery?: IPageSearch[];
}

export interface IFindOne {
  id?: string | number;
  repo: Repository<any>;
  queryDto?: Object;
  selectDto?: Object;
  customQuery?: IPageSearch[];
}

export interface IPageable {
  getSkip(): number;
  getTake(): number;
  getSort(): ISortable;
  // next(totalElements: number): IPageable;
  // previous(totalElements: number): IPageable;
}
