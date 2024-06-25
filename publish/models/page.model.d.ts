import { IGqlPage } from "../interfaces";
export declare class Page<T> {
    nodes: T[];
    totalCount: number;
    pageable: IGqlPage;
}
