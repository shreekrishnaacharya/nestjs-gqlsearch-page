import { IGqlPage, IPage } from "../interfaces";

export class Page<T> {
  public nodes: T[];
  public totalCount: number;
  public pageable: IGqlPage;
}
