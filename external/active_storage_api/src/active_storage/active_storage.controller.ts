import { Controller, Get, Res, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import { ActiveStorageJS } from 'activestorageJS';
@Controller('active_storage')
export class ActiveStorageController {
  @Get(':blob_name')
  findAll(
    @Param('blob_name') blobName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.status(HttpStatus.OK);
    return {
      url: new ActiveStorageJS().service().url(blobName, {
        disposition: 'inline',
        filename: 'something.png',
        contentType: 'image/png',
        tokenDuration: null,
      }),
    };
  }
}
