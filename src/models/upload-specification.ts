import axios from 'axios'
import detectContentType from 'detect-content-type'

export interface PrepareUploadApiResponse {
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

export interface SubmitUploadApiResponse {
  value: UploadInfo[]
  error: boolean
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

export class UploadSpecification {
  method: string
  url: string

  constructor(data: PrepareUploadApiResponse) {
    if (!data) {
      throw new Error('Sharefile API: Empty upload response')
    }

    if (!data.Method || !data.ChunkUri) {
      throw new Error('Sharefile API: Upload details not found')
    }

    this.method = data.Method
    this.url = data.ChunkUri
  }

  async upload(contents: Buffer | string): Promise<UploadInfo> {
    if (this.method !== 'Standard') {
      throw new Error('Sharefile API: Only standard upload method is implemented')
    }

    if (!Buffer.isBuffer(contents)) {
      contents = Buffer.from(contents)
    }

    const headers = {
      'Content-Type': detectContentType(Buffer.from(contents)), // Cloning the
    }

    const response = await axios.post<SubmitUploadApiResponse>(`${this.url}&fmt=json`, contents, {
      headers,
    })

    if (response.data.error) {
      console.error(response.data)
      throw new Error('Sharefile API: Error uploading file')
    }

    return response.data.value[0]
  }
}
