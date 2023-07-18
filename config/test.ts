import { DiskService } from 'storage/disk/disk.service';
export default () => ({
  activeStorage: {
    rootPath: process.env.ELIXIR_STORAGE_PATH || '../playr/storage',
    jwtSecret: '685fd35f346bd020447237213ad0798a',
    linkExpiration: null,
    assetHost: process.env.ASSET_URL || 'http://localhost:4000',
    service: new DiskService(),
  },
  awsUrl: process.env.AWS_S3_URL,
  host: process.env.POSTGRES_HOST || 'localhost',
});
