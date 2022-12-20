import type { PartialDeep } from 'type-fest'
import { SharefileAPI } from './sharefile-node-api.js'

export interface SharefileAuth {
  subdomain: string
  clientId: string
  clientSecret: string
  username: string
  password: string
}

export interface SharefileLoginResponse {
  access_token: string // Returns an access code or access token, depending on which was requested.
  state: string // The optional value that was passed to the authorization page.
  subdomain: string // The user’s ShareFile subdomain, i.e. if they access their ShareFile account through https://mycompany.sharefile.com , this value would return “mycompany”. Some username / password combinations may be active on multiple accounts. The user would need to choose an account in this case.
  apicp: string // The user's ShareFile API control plane, i.e. sharefile.com, securevdr.com, etc.
  appcp: string // The user's ShareFile account control plane, i.e. sharefile.com, securevdr.com, etc.
  expires_in: number // The expiration time in seconds.
  h: string // A SHA-256 HMAC digest of the path and query string signed with your client secret for validation that the values came from ShareFile.
}

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

export interface ChildrenResponse {
  'odata.metadata': string
  'odata.count': number
  url: string
  value: ItemModel[]
}

export interface DownloadResponse {
  DownloadToken: string
  DownloadUrl: string
  DownloadPrepStatusURL?: string
  'odata.metadata': string
  'odata.type': string
}

export interface UploadPrepareResponse {
  Method: string
  ChunkUri: string
  ProgressData?: string
  IsResume?: boolean
  ResumeIndex?: number
  ResumeOffset?: number
  ResumeFileHash?: string
  MaxNumberOfThreads?: number
  CanAcceptParamsInHeaders?: boolean
}

export interface UploadInfo {
  uploadid: string
  parentid: string
  streamid: string
  id: string
  filename: string
  displayname: string
  size: number
  md5: string
}

export interface UploadConfirmResponse {
  value: UploadInfo[]
  error: boolean
}

export type UpdateParams = PartialDeep<ItemModel>

// Library export
export default SharefileAPI
