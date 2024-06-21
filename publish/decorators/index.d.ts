import { IPageSearch, ISelectColumn } from "../interfaces";
export declare function PageSearch(options?: IPageSearch): (target: any, propertyKey: string) => void;
export declare function SelectColumn(options?: ISelectColumn): (target: any, propertyKey: string) => void;
export declare const GqlFields: (...dataOrPipes: unknown[]) => ParameterDecorator;
