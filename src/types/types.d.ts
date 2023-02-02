export interface ItemChildrenApiResponse {
  'odata.metadata': string
  'odata.count': number
  url: string
  value: ItemModel[]
}

export interface FolderTemplateListApiResponse {
  'odata.metadata': string
  'odata.count': number
  url: string
  value: FolderTemplateModel[]
}

export interface RefModel {
  Id: string
  url: string
  'odata.metadata': string
  'odata.type': string
  Name: string
  Description: string
}

export type FolderTemplateModel = RefMode
