import { DiskService } from '../storage/disk/disk.service';
import { S3Client } from '@aws-sdk/client-s3';
export default () => ({
  activeStorage: {
    rootPath: process.env.ELIXIR_STORAGE_PATH || './external/disk/storage',
    jwtSecret: process.env.JWT_SECRET,
    linkExpiration: null,
    s3Bucket: process.env.ASSET_S3_BUCKET || 'playr-test-s3-privateassets-z34ndqmm4mgz',
    assetHost: process.env.ASSET_URL || 'http://localhost.test',
    service: new DiskService()
  },
  awsUrl: process.env.AWS_S3_URL,
  client: new S3Client({
    apiVersion: '2006-03-01',
    endpoint: process.env.AWS_S3_URL, // These two lines are
    forcePathStyle: true, // only needed for LocalStack.
    region: 'us-west-2'
  })
});
