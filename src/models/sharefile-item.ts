import axios, { AxiosRequestConfig } from 'axios'
import { DownloadSpecification } from './download-specification'
import { UploadSpecification } from './upload-specification'
import { stringify } from 'querystring'
import type { ChildrenResponse, DownloadResponse, InfoModel, ItemModel, ItemRefModel, UpdateParams } from 'src/types.js'

export class SharefileItem implements ItemModel {
  Id: string
  url: string
  'odata.metadata': string
  'odata.type': string

  Name: string
  FileName: string
  Parent: ItemRefModel
  Description: string
  FileCount?: number
  Info?: InfoModel
  Hash?: string
  CreationDate: Date
  ProgenyEditDate: Date
  ClientCreatedDate?: Date
  ClientModifiedDate?: Date
  ExpirationDate: Date
  ExpirationDays: number
  DiskSpaceLimit: number
  BandwidthLimitInMB: number
  FileSizeInKB: number
  FileSizeBytes: number
  Path: string
  CreatorFirstName: string
  CreatorLastName: string
  CreatorNameShort: string
  IsHidden: boolean
  HasPendingDeletion: boolean
  HasPermissionInfo: boolean
  HasMultipleVersions: boolean
  HasPendingAsyncOp: boolean
  State: number
  VirusStatus?: string
  PreviewStatus?: string
  StreamID: string
  AssociatedFolderTemplateID: string
  IsTemplateOwned: boolean

  #httpConfig: AxiosRequestConfig

  /**
   * Creates an instance of SharefileItem.
   */
  constructor(data: ItemModel, httpConfig: AxiosRequestConfig) {
    if (!data) {
      throw new Error('Sharefile API: Empty item response')
    }

    if (!data.url) {
      throw new Error('Sharefile API: Item url not found')
    }

    this.#httpConfig = httpConfig

    this.Id = data.Id
    this.url = data.url
    this['odata.metadata'] = data['odata.metadata']
    this['odata.type'] = data['odata.type']

    this.Name = data.Name
    this.FileName = data.FileName
    this.Parent = data.Parent
    this.Description = data.Description
    this.FileCount = data.FileCount
    this.Info = data.Info
    this.Hash = data.Hash
    this.CreationDate = data.CreationDate
    this.ProgenyEditDate = data.ProgenyEditDate
    this.ClientCreatedDate = data.ClientCreatedDate
    this.ClientModifiedDate = data.ClientModifiedDate
    this.ExpirationDate = data.ExpirationDate
    this.ExpirationDays = data.ExpirationDays
    this.DiskSpaceLimit = data.DiskSpaceLimit
    this.BandwidthLimitInMB = data.BandwidthLimitInMB
    this.FileSizeInKB = data.FileSizeInKB
    this.FileSizeBytes = data.FileSizeBytes
    this.Path = data.Path
    this.CreatorFirstName = data.CreatorFirstName
    this.CreatorLastName = data.CreatorLastName
    this.CreatorNameShort = data.CreatorNameShort
    this.IsHidden = data.IsHidden
    this.HasPendingDeletion = data.HasPendingDeletion
    this.HasPermissionInfo = data.HasPermissionInfo
    this.HasMultipleVersions = data.HasMultipleVersions
    this.HasPendingAsyncOp = data.HasPendingAsyncOp
    this.State = data.State
    this.VirusStatus = data.VirusStatus
    this.PreviewStatus = data.PreviewStatus
    this.StreamID = data.StreamID
    this.AssociatedFolderTemplateID = data.AssociatedFolderTemplateID
    this.IsTemplateOwned = data.IsTemplateOwned
  }

  async directDownload(includeAllVersions = false, includeDeleted = false): Promise<Buffer> {
    const params = {
      redirect: true,
      includeAllVersions,
      includeDeleted,
    }

    const response = await axios.get<Buffer>(`${this.url}/Download`, {
      params,
      responseType: 'arraybuffer',
      ...this.#httpConfig,
    })

    return response.data
  }

  async downloadSpecification(includeAllVersions = false, includeDeleted = false): Promise<DownloadSpecification> {
    const params = {
      redirect: false,
      includeAllVersions,
      includeDeleted,
    }

    const response = await axios.get<DownloadResponse>(`${this.url}/Download`, {
      params,
      ...this.#httpConfig,
    })

    return new DownloadSpecification(response.data)
  }

  async parent(): Promise<SharefileItem> {
    const result = await axios.get<ItemModel>(`${this.url}/Parent`, this.#httpConfig)
    return new SharefileItem(result.data, this.#httpConfig)
  }

  async children(includeDeleted = false): Promise<SharefileItem[]> {
    const params = {
      includeDeleted,
    }

    const response = await axios.get<ChildrenResponse>(`${this.url}/Children`, {
      params,
      ...this.#httpConfig,
    })

    return response.data.value.map((item: ItemModel) => new SharefileItem(item, this.#httpConfig))
  }

  async childBy<K extends keyof SharefileItem>(
    propertyName: K,
    propertyVal: SharefileItem[K],
    includeDeleted = false,
  ): Promise<SharefileItem | undefined> {
    const items = await this.children(includeDeleted)

    return items.find((item: SharefileItem) => item[propertyName] === propertyVal)
  }

  async childByName(name: string, includeDeleted = false): Promise<SharefileItem | undefined> {
    return this.childBy('Name', name, includeDeleted)
  }

  async childById(id: string, includeDeleted = false): Promise<SharefileItem | undefined> {
    return this.childBy('Id', id, includeDeleted)
  }

  async upload(contents: string | Buffer, filename: string) {
    const query = {
      method: 'standard',
      raw: true,
      fileName: filename,
    }

    const querystring = stringify(query)
    const url = `${this.url}/Upload?${querystring}`

    const response = await axios.post(url, {}, this.#httpConfig)

    const uploadSpecification = new UploadSpecification(response.data)

    return uploadSpecification.upload(contents)
  }

  async move(toId: string): Promise<SharefileItem> {
    return this.update({ Parent: { Id: toId } })
  }

  async rename(newName: string): Promise<SharefileItem> {
    return this.update({ Name: newName })
  }

  async update(updateBody: UpdateParams): Promise<SharefileItem> {
    const query = {
      overwrite: false,
    }

    const querystring = stringify(query)
    const url = `${this.url}?${querystring}`

    const response = await axios.patch<ItemModel>(url, updateBody, this.#httpConfig)

    Object.keys(updateBody).forEach((k) => {
      const key = k as keyof ItemModel

      const newValue = updateBody[key]
      const updatedValue = response.data[key]

      if (typeof newValue === 'object') {
        Object.keys(newValue).forEach((l) => {
          const innerKey = l as keyof typeof newValue

          const innerNewValue = newValue?.[innerKey]
          const innerUpdatedValue = updatedValue?.[innerKey]

          if (innerNewValue !== innerUpdatedValue) {
            throw new Error(`Sharefile API: Could not update the '${key}' field`)
          }
        })

        return
      }

      if (newValue !== updatedValue) {
        throw new Error(`Sharefile API: Could not update the '${key}' field`)
      }
    })

    Object.assign(this, response.data)

    return this
  }
}
