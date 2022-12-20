import fs from 'fs/promises'
import path from 'path'
import md5 from 'md5-file'
import crypto from 'crypto'
import { AxiosError } from 'axios'
import { credentials, paths } from '../test/config'
import { SharefileAPI } from './sharefile-node-api'
import { DownloadSpecification } from './models/download-specification'
import { UploadSpecification } from './models/upload-specification'

describe('Object creation', () => {
  describe('Sharefile API', () => {
    it('Throws error when creating API without auth params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileAPI()).toThrowError()
    })

    it('Throws error when creating API with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileAPI({ subdomain: 'x' })).toThrowError()
    })

    it('Creates an API object when created with correct auth params', () => {
      const emptyApi = new SharefileAPI(credentials.good)
      expect(emptyApi).toBeTruthy()
    })
  })

  describe('SharefileItem Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileItem()).toThrowError()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileItem({ url: '' })).toThrowError()
    })
  })

  describe('Download Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new DownloadSpecification()).toThrowError()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new DownloadSpecification({ DownloadToken: 'x' })).toThrowError()
    })
  })

  describe('Upload Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new UploadSpecification()).toThrowError()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new UploadSpecification({ ChunkUri: '' })).toThrowError()
    })

    it('Throws error when uploading with an incorrect method', () => {
      const uploadSpec = new UploadSpecification({ ChunkUri: 'x', Method: 'Raw' })
      expect(() => uploadSpec.upload('Data')).rejects.toThrowError()
    })
  })
})

describe('Authentication', () => {
  it('Fails authentication - bad username', async () => {
    const SF = new SharefileAPI(credentials.badUsername)
    expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad password', async () => {
    const SF = new SharefileAPI(credentials.badPassword)
    expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad client id', async () => {
    const SF = new SharefileAPI(credentials.badClientId)
    expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad client secret', async () => {
    const SF = new SharefileAPI(credentials.badSecret)
    expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Authenticates correctly', async () => {
    const SF = new SharefileAPI(credentials.good)
    expect(SF.authenticate()).resolves.toBeTruthy()
  })

  it('Token refreshes after it expires', async () => {
    jest.useFakeTimers()

    const SF = new SharefileAPI(credentials.good)
    const firstToken = await SF.getHttpConfig().then((res) => res.headers?.authorization)
    expect(SF.isTokenExpired).toBe(false)

    const secondToken = await SF.getHttpConfig().then((res) => res.headers?.authorization)
    expect(firstToken === secondToken).toBe(true)

    jest.advanceTimersByTime(30000)
    expect(SF.isTokenExpired).toBe(true)

    const newToken = await SF.getHttpConfig().then((res) => res.headers?.authorization)
    expect(firstToken === newToken).toBe(false)
  })
})

describe('Items', () => {
  let SF: SharefileAPI

  beforeEach(() => {
    SF = new SharefileAPI(credentials.good)
    return SF.authenticate()
  })

  it('Gets home Folder', async () => {
    const folder = await SF.items('/')
    expect(folder['odata.type']).toBe('ShareFile.Api.Models.Folder')
  })

  it('Gets Home Folder - Children', async () => {
    const folder = await SF.items('/')
    expect(folder.children()).resolves.toBeTruthy()
  })

  it('Gets Folder By Path', async () => {
    const folder = await SF.itemsByPath(paths.folder)
    expect(folder['odata.type']).toBe('ShareFile.Api.Models.Folder')
  })

  it('Gets File By Path', async () => {
    const file = await SF.itemsByPath(paths.smallFile)
    expect(file['odata.type']).toBe('ShareFile.Api.Models.File')
  })

  it('Gets Folder By Id', async () => {
    const folder = await SF.itemsByPath(paths.folder)
    expect(folder['odata.type']).toBe('ShareFile.Api.Models.Folder')

    const folderById = await SF.items(folder.Id)
    expect(folderById['odata.type']).toBe('ShareFile.Api.Models.Folder')
  })

  it('Gets the Parent of an Item', async () => {
    const file = await SF.itemsByPath(paths.smallFile)
    expect(file['odata.type']).toBe('ShareFile.Api.Models.File')

    const parent = await file.parent()
    expect(parent['odata.type']).toBe('ShareFile.Api.Models.Folder')
  }, 100000)

  it('Gets Child by Name', async () => {
    const folder = await SF.itemsByPath(paths.folder)

    const child = await folder.childByName(path.basename(paths.smallFile))
    expect(child).toBeTruthy()
    expect(child?.['odata.type']).toBe('ShareFile.Api.Models.File')

    const otherChild = await folder.childByName(paths.badPath)
    expect(otherChild).toBeFalsy()
  }, 100000)

  it('Gets Child by Id', async () => {
    const file = await SF.itemsByPath(paths.smallFile)
    expect(file['odata.type']).toBe('ShareFile.Api.Models.File')

    const parent = await file.parent()
    expect(parent['odata.type']).toBe('ShareFile.Api.Models.Folder')

    const child = await parent.childById(file.Id)
    expect(child).toBeTruthy()
    expect(child?.Id).toBe(file.Id)

    const otherChild = await parent.childById(paths.badPath)
    expect(otherChild).toBeFalsy()
  }, 100000)

  it('Gets Child by Key', async () => {
    const folder = await SF.itemsByPath(paths.folder)

    const child = await folder.childBy('FileSizeBytes', 20)
    expect(child).toBeTruthy()
    expect(child?.['odata.type']).toBe('ShareFile.Api.Models.File')
    expect(child?.Name).toBe(path.basename(paths.smallFile))
  }, 100000)
})

describe('Upload / Download', () => {
  let SF: SharefileAPI

  beforeEach(() => {
    SF = new SharefileAPI(credentials.good)
    return SF.authenticate()
  })

  it('Uploads a text file to Folder', async () => {
    const folder = await SF.itemsByPath(paths.folder)
    const res = await folder.upload('Test!!!', 'testfile.txt')
    expect(res).toBeTruthy()
    expect(res.id).toBeTruthy()
  }, 100000)

  it('Uploads big file to Folder', async () => {
    const filename = './test/BigFile.xlsx'

    const data = await fs.readFile(filename)
    expect(Buffer.isBuffer(data)).toBeTruthy()

    const folder = await SF.itemsByPath(paths.folder)
    const res = await folder.upload(data, 'bigfile.xlsx')
    expect(res).toBeTruthy()
    expect(res.id).toBeTruthy()

    const md5Hash = md5.sync(filename)
    expect(res.md5).toBe(md5Hash)
  }, 100000)
})

describe('Updates', () => {
  let SF: SharefileAPI

  beforeEach(() => {
    SF = new SharefileAPI(credentials.good)
    return SF.authenticate()
  })

  it('Renames a file', async () => {
    const fileName = 'rename_test.txt'
    const newName = 'rename_test_renamed.txt'

    const folder = await SF.itemsByPath(paths.folder)
    await folder.upload('Rename Test File Content', fileName)

    const file = await SF.itemsByPath(`${paths.folder}/${fileName}`)
    await file.rename(newName)
    expect(file.Name).toBe(newName)

    await file.rename(fileName)
    expect(file.Name).toBe(fileName)
  }, 100000)

  it('Fails when renaming to an invalid name', async () => {
    const fileName = 'rename_test_invalid.txt'
    const newName = 'rename_test_invalid:/.txt'

    const folder = await SF.itemsByPath(paths.folder)
    await folder.upload('Rename Test File Content', fileName)

    const file = await SF.itemsByPath(`${paths.folder}/${fileName}`)
    expect(() => file.rename(newName)).rejects.toThrowError()
  }, 100000)

  it('Moves a file', async () => {
    const fileName = 'test.txt'

    const fromFolder = await SF.itemsByPath(`${paths.folder}/from`)
    const fromFolderId = fromFolder.Id

    const toFolder = await SF.itemsByPath(`${paths.folder}/to`)
    const toFolderId = toFolder.Id

    await fromFolder.upload('Move Test File Content', fileName)
    const file = await SF.itemsByPath(`${paths.folder}/from/${fileName}`)
    expect(file.Parent.Id).toBe(fromFolderId)

    await file.move(toFolderId)
    expect(file.Parent.Id).toBe(toFolderId)

    await file.move(fromFolderId)
    expect(file.Parent.Id).toBe(fromFolderId)
  }, 100000)

  it('Fails when moving a file to an invalid directory', async () => {
    const fileName = 'test.txt'

    const fromFolder = await SF.itemsByPath(`${paths.folder}/from`)
    await fromFolder.upload('Move Test File Content', fileName)

    const file = await SF.itemsByPath(`${paths.folder}/from/${fileName}`)
    expect(() => file.move('123123123')).rejects.toThrowError()
  }, 100000)
})

describe('Download', () => {
  let SF: SharefileAPI

  beforeEach(() => {
    SF = new SharefileAPI(credentials.good)
    return SF.authenticate()
  })

  it('Direct downloads a small file', async () => {
    const file = await SF.itemsByPath(paths.smallFile)
    const data = await file.directDownload()

    expect(data).toBeTruthy()
    expect(Buffer.isBuffer(data)).toBeTruthy()
    expect(data.toString('utf-8').length).toBe(20)
  }, 100000)

  it('Direct downloads an empty file', async () => {
    const file = await SF.itemsByPath(paths.emptyFile)
    const data = await file.directDownload()

    expect(data).toBeTruthy()
    expect(Buffer.isBuffer(data)).toBeTruthy()
    expect(data.toString('utf-8').length).toBe(0)
  }, 100000)

  it('Direct downloads a large file', async () => {
    const file = await SF.itemsByPath(paths.largeFile)
    const data = await file.directDownload()

    expect(data).toBeTruthy()
    expect(Buffer.isBuffer(data)).toBeTruthy()
    expect(data.length).toBe(16_641_655)

    const remoteHash = crypto.createHash('md5').update(data).digest('hex')
    expect(remoteHash).toBe(file.Hash)
  }, 100000)

  it('Gets a download specification', async () => {
    const file = await SF.itemsByPath(paths.largeFile)
    const data = await file.downloadSpecification()

    expect(data).toBeTruthy()
    expect(data.url).toBeTruthy()
    expect(data.token).toBeTruthy()
  }, 100000)
})

/*


import paths from '../../config/secrets/paths'

*/
/*
function sleep(milliseconds: number) {
  const date = Date.now()
  let currentDate = null
  do {
    currentDate = Date.now()
  } while (currentDate - date < milliseconds)
}
*/
/*


it('Moves File', async () => {
  const SF = new ShareFileAPI(credentials.good)

  const fromFolderPath = 'Personal Folders/TestUpload/'
  const fromFolderID = await SF.itemsByPath(fromFolderPath).then((file) => file.Id)

  const toFolderPath = 'Personal Folders/TestScans/'
  const toFolderID = await SF.itemsByPath(toFolderPath).then((file) => file.Id)

  const fileName = 'test.txt'

  const testFilePath = 'Personal Folders/TestUpload/' + fileName
  const file = await SF.itemsByPath(testFilePath)
  await file.move(toFolderID)
  expect(file.Parent.Id).toBe(toFolderID)
  await file.move(fromFolderID)
  expect(file.Parent.Id).toBe(fromFolderID)
})
*/
