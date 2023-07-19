import { S3Service } from 'storage/s3/s3.service';
export default () => ({
  activeStorage: {
    jwtSecret: '685fd35f346bd020447237213ad0798a',
    linkExpiration: null,
    assetHost: process.env.ASSET_URL || 'https://api.giveaways.joinsurf-staging.com',
    s3Bucket: process.env.ASSET_S3_BUCKET || 'playr-staging-s3-privateassets-1niykaa18f2bj',
    service: new S3Service()
  },
  awsUrl: process.env.AWS_S3_URL
});
