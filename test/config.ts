import creds from './secrets/auth'
import path from './secrets/paths'

const BAD_STRING = '$_NOT_REAL_DATA_$'

export const paths = {
  folder: path.folder,
  largeFile: path.largeFile,
  smallFile: path.smallFile,
  emptyFile: path.emptyFile,
  badPath: BAD_STRING,
}

export const credentials = {
  good: {
    subdomain: creds.subdomain,
    username: creds.username,
    password: creds.password,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  },
  badUsername: {
    subdomain: creds.subdomain,
    username: BAD_STRING,
    password: creds.password,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  },
  badPassword: {
    subdomain: creds.subdomain,
    username: creds.username,
    password: BAD_STRING,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  },
  badClientId: {
    subdomain: creds.subdomain,
    username: creds.username,
    password: creds.password,
    clientId: BAD_STRING,
    clientSecret: creds.clientSecret,
  },
  badSecret: {
    subdomain: creds.subdomain,
    username: creds.username,
    password: creds.password,
    clientId: creds.clientId,
    clientSecret: BAD_STRING,
  },
}
