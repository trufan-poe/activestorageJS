import { DiskService } from 'storage/disk/disk.service';
export default () => ({
  activeStorage: {
    rootPath: process.env.ELIXIR_STORAGE_PATH || '../playr/storage',
    jwtSecret: process.env.JWT_SECRET,
    linkExpiration: null,
    assetHost: process.env.ASSET_URL || 'http://localhost.test',
    service: new DiskService()
  },
  awsUrl: process.env.AWS_S3_URL
});
