import axios, { type AxiosRequestConfig } from 'axios'
import { isItemID } from './helpers/is-item-id'
import { SharefileItem } from './models/sharefile-item'
import type { FolderTemplateListApiResponse, FolderTemplateModel } from './types/types'

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

export class SharefileAPI {
  #auth: SharefileAuth
  #tokenExpiresOn?: Date
  #accessToken?: string

  /**
   * Creates an instance of ShareFileAPI.
   */
  constructor(auth: SharefileAuth) {
    const requiredProps: (keyof SharefileAuth)[] = ['subdomain', 'username', 'password', 'clientId', 'clientSecret']
    requiredProps.forEach((prop) => {
      if (!auth[prop]) {
        throw Error(`Prop [${prop}] is required`)
      }
    })

    this.#auth = auth
  }

  get isTokenExpired(): boolean {
    if (!this.#tokenExpiresOn) {
      return true
    }

    return new Date() >= this.#tokenExpiresOn
  }

  get apiPath(): string {
    return `https://${this.#auth.subdomain}.sf-api.com/sf/v3`
  }

  get authPath(): string {
    return `https://${this.#auth.subdomain}.sharefile.com/oauth/token`
  }

  async getHttpConfig(): Promise<AxiosRequestConfig> {
    let accessToken = this.#accessToken
    if (!accessToken || this.isTokenExpired) {
      accessToken = await this.authenticate()
    }

    return {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  }

  /**
   * Authenticates API with Sharefile.
   */
  async authenticate(): Promise<string> {
    const config = {
      grant_type: 'password',
      username: this.#auth.username,
      password: this.#auth.password,
      client_id: this.#auth.clientId,
      client_secret: this.#auth.clientSecret,
    }

    const { data } = await axios.post<SharefileLoginResponse>(this.authPath, config, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'identity',
      },
    })

    this.#tokenExpiresOn = new Date(new Date().getTime() + data.expires_in)
    this.#accessToken = data.access_token
    return data.access_token
  }

  /**
   * Takes an Item ID/PAth and returns a single SharefileItem.
   *
   * Special Id's: [home, favorites, allshared, connectors, box, top]
   *
   * > home - Return home folder.
   *
   * > favorites - Return parent favorite item; ex: .../Items(favorites)/Children to get the favorite folders.
   *
   * > allshared - Return parent Shared Folders item; ex: .../Items(allshared)/Children to get the shared folders.
   *
   * > connectors - Return parent Connectors item; ex: .../Items(connectors)/Children to get indiviual connectors.
   *
   * > box - Return the FileBox folder.
   *
   * > top - Returns the Top item; ex: .../Items(top)/Children to get the home, favorites, and shared folders as well as the connectors
   */
  async items(str: string): Promise<SharefileItem> {
    if (!isItemID(str)) {
      return this.itemsByPath(str)
    }

    const httpConfig = await this.getHttpConfig()
    const basePath = `${this.apiPath}/Items`
    const idPath = str ? `(${str})` : ''

    const result = await axios.get(basePath + idPath, httpConfig)
    return new SharefileItem(result.data, httpConfig)
  }

  /**
   * Retrieves an item from its path.
   *
   * The path is of format /foldername/foldername/filename
   *
   * This call may redirect the client to another API provider, if the path contains a symbolic link.
   */
  async itemsByPath(path: string): Promise<SharefileItem> {
    const httpConfig = await this.getHttpConfig()
    const uri = `${this.apiPath}/Items/ByPath?path=${path}`

    const result = await axios.get(uri, httpConfig)
    return new SharefileItem(result.data, httpConfig)
  }

  async listFolderTemplates(): Promise<FolderTemplateModel[]> {
    const httpConfig = await this.getHttpConfig()
    const url = `${this.apiPath}/FolderTemplates`

    const result = await axios.get<FolderTemplateListApiResponse>(url, httpConfig)
    return result.data.value
  }

  async getFolderTemplate(id: string): Promise<FolderTemplateModel> {
    const httpConfig = await this.getHttpConfig()
    const path = `${this.apiPath}/FolderTemplates(${id})`

    const result = await axios.get<FolderTemplateModel>(path, httpConfig)
    return result.data
  }
}
