# ActiveStorageJS

### Description

ActiveStorageJS provides a backwards-compatible way of downloading and uploading Blobs created using the Ruby on Rails framework storage engine ActiveStorage.

### Development

Clone this repository and use Yarn to install dependencies.

```bash
yarn
```

Jest is used for testing. To run a specific test:

```bash
yarn test path/to/feature.spec.ts
```

The project currently has 2 storage services configured.

- DiskService
- S3Service

To add more services such as Azure or GCS follow the following steps:

1. Extend the StorageService class found in `storage/service.abstract.ts`
2. Provide definitions for the following functions: `url, download, streamDownload, upload, exists, delete`
3. Add the new class to the config file of the relevant environment. Make sure to export with the new operator to avoid requests clobbering each other's variables.

### Installation and Usage

Install the package in your project

```bash
yarn add github:surf-app/activestorageJS --save
```

Import the package in your code

```ts
import { ActiveStorageJS } from 'activestorageJS';
```

**Use the package to get a download link for a particular blob:**

```ts
return {
  url: new ActiveStorageJS().service().url('blobName', {
    disposition: 'attachment',
    filename: 'something.png',
    contentType: 'image/png',
    tokenDuration: null
  })
};
```

**Download a file using a key:**

```ts
const file: Buffer = await new ActiveStorageJS().service().download(validated['key']);
res.status(HttpStatus.OK);
res.setHeader('Content-Type', validated['content_type']);
res.setHeader('Content-Disposition', 'inline');
res.send(file);
```
