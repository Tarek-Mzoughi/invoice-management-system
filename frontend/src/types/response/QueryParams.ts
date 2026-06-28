export interface QueryParams {
  select?: string;
  join?: string;
  sort?: string;
  cache?: string;
  limit?: string | number;
  page?: string | number;
  filter?: string;
}
