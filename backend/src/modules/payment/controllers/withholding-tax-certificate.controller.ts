import {
  Controller,
  Get,
  Param,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AdvancedRequest } from 'src/types';
import { WithholdingTaxCertificatePdfService } from '../services/withholding-tax-certificate-pdf.service';

@ApiTags('withholding-tax-certificates')
@Controller({ version: '1', path: '/withholding-tax/certificates' })
export class WithholdingTaxCertificateController {
  constructor(
    private readonly certificatePdfService: WithholdingTaxCertificatePdfService,
  ) {}

  @Get('/:paymentId/preview')
  @ApiParam({ name: 'paymentId', type: 'number', required: true })
  async preview(
    @Param('paymentId') paymentId: number,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    req.logInfo = { paymentId };
    const certificate = await this.certificatePdfService.generateCertificatePdf(
      Number(paymentId),
    );
    return this.toPdfStream(
      certificate.pdfBuffer,
      certificate.filename,
      'inline',
    );
  }

  @Get('/:paymentId/download')
  @ApiParam({ name: 'paymentId', type: 'number', required: true })
  async download(
    @Param('paymentId') paymentId: number,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    req.logInfo = { paymentId };
    const certificate = await this.certificatePdfService.generateCertificatePdf(
      Number(paymentId),
    );
    return this.toPdfStream(
      certificate.pdfBuffer,
      certificate.filename,
      'attachment',
    );
  }

  private toPdfStream(
    pdfBuffer: Buffer,
    filename: string,
    disposition: 'inline' | 'attachment',
  ): StreamableFile {
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `${disposition}; filename="${filename}"`,
    });
  }
}
