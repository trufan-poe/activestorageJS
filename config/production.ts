import { S3Service } from 'storage/s3/s3.service';
export default () => ({
  activeStorage: {
    jwtSecret: process.env.JWT_SECRET,
    linkExpiration: null,
    assetHost: process.env.ASSET_URL || 'https://api.playr.gg',
    s3Bucket: process.env.ASSET_S3_BUCKET || 'playr-prod-s3-privateassets-z34ndqmm4mgz',
    service: new S3Service()
  },
  awsUrl: process.env.AWS_S3_URL
});
