import { FindManyOptions } from "typeorm";
import { Page } from "../models/page.model";
import { IFindAllByPage, IFindOne, IFindOptionByPage } from "../interfaces";
export declare function findAllByPage<T>({ repo, queryDto, sort, gqlPage, selectDto, customQuery, }: IFindAllByPage<T>): Promise<Page<T>>;
export declare function findOptions<T>({ queryDto, sort, gqlPage, selectDto, customQuery, }: IFindOptionByPage): FindManyOptions;
export declare function findOne<T>({ id, repo, queryDto, selectDto, customQuery, }: IFindOne): Promise<T>;
