export interface DownloadApiResponse {
  DownloadToken: string
  DownloadUrl: string
  DownloadPrepStatusURL?: string
  'odata.metadata': string
  'odata.type': string
}

export class DownloadSpecification {
  token: string
  url: string
  prepStatus?: string
  OdataMetadata: string
  OdataType: string

  constructor(data: DownloadApiResponse) {
    if (!data) {
      throw new Error('Sharefile API: Empty download response')
    }

    if (!data.DownloadToken || !data.DownloadUrl) {
      throw new Error('Sharefile API: Download details not found')
    }

    this.token = data.DownloadToken
    this.url = data.DownloadUrl
    this.prepStatus = data.DownloadPrepStatusURL
    this.OdataMetadata = data['odata.metadata']
    this.OdataType = data['odata.type']
  }
}
