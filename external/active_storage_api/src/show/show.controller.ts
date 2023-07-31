import { Controller, Get, Res, Req, HttpStatus, Param } from '@nestjs/common';
import { Response, Request } from 'express';
import { ActiveStorageJS } from 'activestorageJS';
import { JwtService } from '@nestjs/jwt';
@Controller('show')
export class ShowController {
  @Get(':token/:filename')
  async findAll(@Res() res: Response, @Req() req: Request) {
    try {
      const newToken = req.originalUrl.split('/')[2];
      const validated = new JwtService().verify(
        Buffer.from(newToken, 'base64').toString(),
        {
          publicKey: process.env.JWT_SECRET,
        },
      );
      const file: Buffer = await new ActiveStorageJS()
        .service()
        .download(validated['key']);
      res.status(HttpStatus.OK);
      res.setHeader('Content-Type', validated['content_type']);
      res.setHeader('Content-Disposition', 'inline');
      res.send(file);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST);
      res.send({});
    }
  }
}
