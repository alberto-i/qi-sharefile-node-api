import type { PartialDeep } from 'type-fest'

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

/*
export interface UserModel {
  FullName?: string //The first and last name of the user
  Favorites?: FavoriteModel[] //List of Favorite items associated with the user
  Groups?: GroupModel[] // List of Groups the user belongs. Only available when authenticated user and user match.
}

export interface FavoriteModel {
  User?: UserModel // Creator of the Favorite
  Item?: ItemModel // The item which is marked as Favorite
  DisplayPosition?: number // The position within the set of Favorite items where this Favorite should be displayed
  Alias?: string // The alias name of the Favorite
  CreationDate?: Date // Date when the item was marked favorite
}

export interface GroupModel {
  Owner?: UserModel // The group's owner
  Account?: AccountModel // Account
  IsShared?: boolean // Whether this group is public
  NumberOfContacts?: number // Number of group contacts
  Contacts?: ContactModel[] // List of group contacts
}

export interface AccountModel {
  PlanName?: string // Basic, Professional, Enterprise
  BillingType?: string // Credit Card, Invoice, Comp
  BillingCycle?: string // Monthly, Quarterly, Annually
  BaseBandwidth?: number // Bandwidth included in plan in megabytes
  BaseDiskSpace?: number // Disk space included in megabytes
  BaseUsers?: number // Users included in plan
  AdditionalBandwidth?: number //Additional bandwidth purchased for account
  AdditionalDiskSpace?: number //Additional disk space purchased for account
  AdditionalUsers?: number //Additional users purchased for account
  AdditionalBandwidthRate?: number // Additional rate for extra bandwidth. NOTE: This is specified in gigbytes, not megabytes.
  AdditionalDiskSpaceRate?: number // Additional rate for extra diskspace. NOTE: This is specified in gigbytes, not megabytes.
  AdditionalUserRate: number // Additional rate for extra users
  DiskSpaceMax: number //Maximum disk space for the account in megabtyes
  BandwidthMax: number //Maximum bandwidth for the account in megabtyes
  PowerToolsRate: number // Additional rate for adding PowerTools.
  EncryptionRate: number // Additional rate for stored file encryption
  Subdomain: string // Primary (first) subdomain
  Subdomains: string[] // All subdomains assigned to account
}

export interface ContactModel {
  FirstName: string // FirstName
  LastName: string // LastName
  Company: string // Company
  EmailMedium: string // First 40 characters of the e-mail address
  EmailShort: string // First 20 characters of the e-mail address
  Count: number // Number of members in a distribution group. Will only be filled for distribution group.
  CreatedDate: Date // Date this user was created
}

export interface AccessControlModel {
  Item: ItemModel //Item that was given permission through this rule
  Principal: PrincipalModel // Principal - User or Group - that has been granted permissions through this rule
  CanUpload: boolean // Defines whether the principal can add files (upload) into the Item
  CanDownload: boolean // Defines whether the principal can read file content (download) from this Item
  CanView: boolean // Defines whether the principal can view items (browse) from this Item
  CanDelete: boolean // Defines whether the principal can remove items from this Item
  CanManagePermissions: boolean // Defines whether the principal can configure Access Controls in this Item
  NotifyOnUpload: boolean // Defines the notification preference for upload events. If set, the principal will receive notifications when new files are uploaded into this Item
  NotifyOnDownload: boolean // Defines the notification preference for download events. If set, the principal will receive notifiation when items are downloaded from this Item.
  IsOwner: boolean // Defines whether the principal is the owner of this Item
}

export interface PrincipalModel {
  Name: string // User name
  Email: string // Email address
  Username: string // Username for the account - the value used for login. This is the same as Email for ShareFile accounts, but may be different on Connectors
  Domain: string // Account domain
  AccountId: string // Account id
}

export interface ZoneModel {
  Secret: string // Zone secret used for securing communications.
  ZoneType: string // Zone type
  Account: AccountModel // Zone account - only set on Private zones
  HeartBeatTolerance: number // Specifies how much time between heartbeats before sharefile.com will remove a Storage Center from load balancing
  PingBackInterval: number // Specifies how often sharefile.com will attempt to connect back to the Zone and determine if the zone is healthy.
  Version: string // Zone version - this parameter cannot be set, it is determined from the version of its storage centers. A zone version is the lowest version of a storage center in that zone
  IsHIPAAZone: boolean // Specifies if the zone is a HIPAA zone
  IsMultiTenant: boolean // Specifies if the zone is a multi-tenant zone
  Metadata: MetadataModel[] // List of metadata objects associated with this zone
}

export interface MetadataModel {
  Name: string // The name of a custom metadata entry
  Value: string // The value of a custom metadata entry
  IsPublic: boolean // Whether the metadata entry is public or private. Used only by the zone or storage center metadata where only zone admins have access to private metadata.
}
*/
