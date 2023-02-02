import fs from 'fs/promises'
import path from 'path'
import md5 from 'md5-file'
import crypto from 'crypto'
import { AxiosError } from 'axios'
import { credentials, paths } from './config'
import { SharefileAPI, DownloadSpecification, UploadSpecification } from '../src'

jest.setTimeout(30000)

describe('Object creation', () => {
  describe('Sharefile API', () => {
    it('Throws error when creating API without auth params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileAPI()).toThrow()
    })

    it('Throws error when creating API with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileAPI({ subdomain: 'x' })).toThrow()
    })

    it('Creates an API object when created with correct auth params', () => {
      const emptyApi = new SharefileAPI(credentials.good)
      expect(emptyApi).toBeTruthy()
    })
  })

  describe('SharefileItem Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileItem()).toThrow()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new SharefileItem({ url: '' })).toThrow()
    })
  })

  describe('Download Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new DownloadSpecification()).toThrow()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new DownloadSpecification({ DownloadToken: 'x' })).toThrow()
    })
  })

  describe('Upload Specification', () => {
    it('Throws error when creating specification without params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new UploadSpecification()).toThrow()
    })

    it('Throws error when creating specification with missing params', () => {
      // @ts-expect-error Trying to check for error
      expect(() => new UploadSpecification({ ChunkUri: '' })).toThrow()
    })

    it('Throws error when uploading with an incorrect method', async () => {
      const uploadSpec = new UploadSpecification({ ChunkUri: 'x', Method: 'Raw' })
      await expect(() => uploadSpec.upload('Data')).rejects.toThrow()
    })
  })
})

describe('Authentication', () => {
  it('Fails authentication - bad username', async () => {
    const SF = new SharefileAPI(credentials.badUsername)
    await expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad password', async () => {
    const SF = new SharefileAPI(credentials.badPassword)
    await expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad client id', async () => {
    const SF = new SharefileAPI(credentials.badClientId)
    await expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Fails authentication - bad client secret', async () => {
    const SF = new SharefileAPI(credentials.badSecret)
    await expect(SF.authenticate()).rejects.toThrow(AxiosError)
  })

  it('Authenticates correctly', async () => {
    const SF = new SharefileAPI(credentials.good)
    await expect(SF.authenticate()).resolves.toBeTruthy()
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
    await expect(folder.children()).resolves.toBeTruthy()
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
  })

  it('Gets Child by Name', async () => {
    const folder = await SF.itemsByPath(paths.folder)

    const child = await folder.childByName(path.basename(paths.smallFile))
    expect(child).toBeTruthy()
    expect(child?.['odata.type']).toBe('ShareFile.Api.Models.File')

    const otherChild = await folder.childByName(paths.badPath)
    expect(otherChild).toBeFalsy()
  })

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
  })

  it('Gets Child by Key', async () => {
    const folder = await SF.itemsByPath(paths.folder)

    const child = await folder.childBy('FileSizeBytes', 20)
    expect(child).toBeTruthy()
    expect(child?.['odata.type']).toBe('ShareFile.Api.Models.File')
    expect(child?.Name).toBe(path.basename(paths.smallFile))
  })
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
  })

  it('Uploads big file to Folder', async () => {
    const filename = './test/files/LargeFile.xlsx'

    const data = await fs.readFile(filename)
    expect(Buffer.isBuffer(data)).toBeTruthy()

    const folder = await SF.itemsByPath(paths.folder)
    const res = await folder.upload(data, 'LargeFile_Upload.xlsx')
    expect(res).toBeTruthy()
    expect(res.id).toBeTruthy()

    const md5Hash = md5.sync(filename)
    expect(res.md5).toBe(md5Hash)
  })
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
    await file.renameTo(newName)
    expect(file.Name).toBe(newName)

    await file.renameTo(fileName)
    expect(file.Name).toBe(fileName)
  })

  it('Fails when renaming to an invalid name', async () => {
    const fileName = 'rename_test_invalid.txt'
    const newName = 'rename_test_invalid:/.txt'

    const folder = await SF.itemsByPath(paths.folder)
    await folder.upload('Rename Test File Content', fileName)

    const file = await SF.itemsByPath(`${paths.folder}/${fileName}`)
    await expect(() => file.renameTo(newName)).rejects.toThrow()
  })

  it('Moves a file', async () => {
    const fileName = 'test.txt'

    const fromFolder = await SF.itemsByPath(`${paths.folder}/from`)
    const fromFolderId = fromFolder.Id

    const toFolder = await SF.itemsByPath(`${paths.folder}/to`)
    const toFolderId = toFolder.Id

    await fromFolder.upload('Move Test File Content', fileName)
    const file = await SF.itemsByPath(`${paths.folder}/from/${fileName}`)
    expect(file.Parent.Id).toBe(fromFolderId)

    await file.moveTo(toFolderId)
    expect(file.Parent.Id).toBe(toFolderId)

    await file.moveTo(fromFolderId)
    expect(file.Parent.Id).toBe(fromFolderId)
  })

  it('Fails when moving a file to an invalid directory', async () => {
    const fileName = 'test.txt'

    const fromFolder = await SF.itemsByPath(`${paths.folder}/from`)
    await fromFolder.upload('Move Test File Content', fileName)

    const file = await SF.itemsByPath(`${paths.folder}/from/${fileName}`)
    await expect(() => file.moveTo('InvalidFolderId')).rejects.toThrow()
  })
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
  })

  it('Direct downloads an empty file', async () => {
    const file = await SF.itemsByPath(paths.emptyFile)
    const data = await file.directDownload()

    expect(data).toBeTruthy()
    expect(Buffer.isBuffer(data)).toBeTruthy()
    expect(data.toString('utf-8').length).toBe(0)
  })

  it('Direct downloads a large file', async () => {
    const file = await SF.itemsByPath(paths.largeFile)
    const data = await file.directDownload()

    expect(data).toBeTruthy()
    expect(Buffer.isBuffer(data)).toBeTruthy()
    expect(data.length).toBe(16_641_655)

    const remoteHash = crypto.createHash('md5').update(data).digest('hex')
    expect(remoteHash).toBe(file.Hash)
  })

  it('Gets a download specification', async () => {
    const file = await SF.itemsByPath(paths.largeFile)
    const data = await file.downloadSpecification()

    expect(data).toBeTruthy()
    expect(data.url).toBeTruthy()
    expect(data.token).toBeTruthy()
  })
})

describe('Folder creation and Folder Templates', () => {
  let SF: SharefileAPI
  const testFolderName = 'test-folder'

  beforeEach(async () => {
    SF = new SharefileAPI(credentials.good)
    const auth = await SF.authenticate()

    try {
      const testFolder = await SF.itemsByPath(`${paths.folder}/${testFolderName}`)
      await testFolder.delete()
    } catch (e) {
      // Folder may not exist.
    }

    return auth
  })

  it('Creates a folder', async () => {
    const folder = await SF.itemsByPath(paths.folder)
    const newFolder = await folder.createFolder(testFolderName)

    expect(newFolder).toBeTruthy()
    expect(newFolder.Name).toBe(testFolderName)
  })

  it('Creates and deletes a folder', async () => {
    const folder = await SF.itemsByPath(paths.folder)
    const newFolder = await folder.createFolder(testFolderName)

    expect(newFolder).toBeTruthy()
    expect(newFolder.Name).toBe(testFolderName)

    await newFolder.delete()

    const promise = SF.itemsByPath(`${paths.folder}/${testFolderName}`)
    await expect(() => promise).rejects.toThrow()
  })

  it('Lists available folder templates', async () => {
    const templates = await SF.listFolderTemplates()

    expect(templates).toBeTruthy()
  })

  it('Gets a folder template', async () => {
    const templates = await SF.listFolderTemplates()
    expect(templates).toBeTruthy()

    const template = templates[0]
    expect(template).toBeTruthy()

    const folderTemplate = await SF.getFolderTemplate(template.Id)
    expect(folderTemplate).toBeTruthy()
  })

  it('Creates a folder using a folder template', async () => {
    const templates = await SF.listFolderTemplates()
    expect(templates).toBeTruthy()

    const template = templates[0]
    expect(template).toBeTruthy()

    const folder = await SF.itemsByPath(paths.folder)
    const newFolder = await folder.createFolder(testFolderName, template.Id)

    expect(newFolder).toBeTruthy()
    expect(newFolder.Name).toBe(testFolderName)
    expect(newFolder.AssociatedFolderTemplateID).toBe(template.Id)
  })
})
