export interface FileInfo {
  name: string
  path: string
}

export interface DataFrameResult {
  schema: [string, string][]
  data: string[][]
}