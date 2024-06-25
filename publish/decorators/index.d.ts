import { IPageSearch, ISelectColumn, ISortColumn } from "../interfaces";
export declare function PageSearch(options?: IPageSearch): (target: any, propertyKey: string) => void;
export declare function SelectColumn(options?: ISelectColumn): (target: any, propertyKey: string) => void;
export declare function SortColumn(options?: ISortColumn): (target: any, propertyKey: string) => void;
export declare const GqlFields: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
