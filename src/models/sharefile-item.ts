import axios, { AxiosRequestConfig } from 'axios'
import { DownloadApiResponse, DownloadSpecification } from './download-specification'
import { UploadSpecification } from './upload-specification'
import { stringify } from 'querystring'

export interface ItemRefModel {
  Id: string
  url: string
  'odata.metadata': string
  'odata.type': string
}

export interface ItemModel extends ItemRefModel {
  Name: string // Item Name
  FileName: string // Item File Name. ShareFile allows Items to have different Display and File names: display names are shown during client navigation, while file names are used when the item is downloaded.
  Description: string // Item description
  Parent: ItemRefModel // Parent container of the Item. A container is usually a Folder object, with a few exceptions - the "Account" is the container of top-level folders.

  FileCount?: number
  Info?: InfoModel

  Hash?: string

  CreationDate: Date // Item Creation Date.
  ProgenyEditDate: Date // The last modified date of this item and all of its children, recursively. This parameter is not supported in all ShareFile providers - it is always set in sharefile.com hosting, but not in some StorageZone connectors. The Capability object of the provider indicates whether the provider supports this field or not.

  ClientCreatedDate?: Date
  ClientModifiedDate?: Date

  ExpirationDate: Date // Defines the Retention Policy for this Item. After this date, the item is automatically moved to recycle bin.
  ExpirationDays: number // Amount of days until this item expireses (see ExpirationDate)

  DiskSpaceLimit: number // Disk space limit for the Item. Define the maximum amount of bytes that this container can hold at any given time.
  BandwidthLimitInMB: number // Bandwidth limit for the Item. Define the maximum amount of bytes that can be added and retrieved from this item.
  FileSizeInKB: number // Item size in Kilobytes. For containers, this field includes all children sizes, recursively.
  FileSizeBytes: number // Item size in bytes. For containers, this field will include all children sizes, recursively.
  Path: string // Contains a path, separated by /, from the virtual root to the parent folder for the given file. Example /accountID/folderID/folderID

  CreatorFirstName: string // First name of the user that created this item
  CreatorLastName: string // Last name of the user that created this item
  CreatorNameShort: string // Short version of items creator's name. E.g., J. Doe.

  IsHidden: boolean // Defines whether the Item has a 'hidden' flag.
  HasPendingDeletion: boolean // Indicates that the Item is pending for removal. At the next execution of the Cleanup process, the data blob associated with this item will be removed. This parameter is not used for certain Storage Zone Providers. For example, in CIFS and SharePoint connectors, removals are performed imediately. The Capability "HasRecycleBin" indicates whether this field is used or not in the provider.
  HasPermissionInfo: boolean
  HasMultipleVersions: boolean // Specifies whether there are other versions of this item. Not all providers support file versioning. The Capability FileVersioning indicates whether the provider supports file versions.
  HasPendingAsyncOp: boolean // Specifies whether or not an Item has a pending async operation.
  State: number
  VirusStatus?: string
  PreviewStatus?: string

  StreamID: string // Identifier for the Item stream. An Item represents a single version of a file system object. The stream identifies all versions of the same file system object. For example, when users upload or modify an existing file, a new Item is created with the same StreamID. All Item enumerations return only the latest version of a given stream. You can access the previous versions of a file using the StreamID reference.

  AssociatedFolderTemplateID: string // Folder Template reference. If set, it indicates that this Item was created from a Folder Template. Modifications to the folder template are propagated to the associated items. The Capability FolderTemplate indicates whether the provider supports Folder Templates.
  IsTemplateOwned: boolean // Indicates whether the item is owned by a Folder Template. If set, it indicates that this Item was created from a Folder Template. Modifications to the folder template are propagated to the associated items. The Capability FolderTemplate indicates whether the provider supports Folder Templates.
}

export interface InfoModel extends Omit<ItemRefModel, 'Id'> {
  HasVroot: boolean
  IsSystemRoot: boolean
  IsAccountRoot: boolean
  IsVRoot: boolean
  IsMyFolders: boolean
  IsAHomeFolder: boolean
  IsMyHomeFolder: boolean
  IsAStartFolder: boolean
  IsSharedFolder: boolean
  IsPassthrough: boolean
  CanAddFolder: boolean
  CanAddNode: boolean
  CanView: boolean
  CanDownload: boolean
  CanUpload: boolean
  CanSend: boolean
  CanDeleteCurrentItem: boolean
  CanDeleteChildItems: boolean
  CanManagePermissions: boolean
  CanCreateOfficeDocuments: boolean
  FolderPayID: string
  ShowFolderPayBuyButton: boolean
}

export interface ChildrenApiResponse {
  'odata.metadata': string
  'odata.count': number
  url: string
  value: ItemModel[]
}

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export type UpdateParams = DeepPartial<ItemModel>

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

    const response = await axios.get<DownloadApiResponse>(`${this.url}/Download`, {
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

    const response = await axios.get<ChildrenApiResponse>(`${this.url}/Children`, {
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

  async moveTo(newParentId: string): Promise<SharefileItem> {
    return this.update({ Parent: { Id: newParentId } })
  }

  async renameTo(newName: string): Promise<SharefileItem> {
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
