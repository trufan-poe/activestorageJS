import { S3Service } from '../storage/s3/s3.service';
import { S3Client } from '@aws-sdk/client-s3';
export default () => ({
  activeStorage: {
    jwtSecret: process.env.JWT_SECRET,
    linkExpiration: null,
    assetHost: process.env.ASSET_URL || 'https://api.playr.gg',
    s3Bucket: process.env.ASSET_S3_BUCKET || 'playr-prod-s3-privateassets-z34ndqmm4mgz',
    service: new S3Service()
  },
  awsUrl: process.env.AWS_S3_URL,
  client: new S3Client({
    apiVersion: '2006-03-01',
    region: 'us-west-2'
  })
});
