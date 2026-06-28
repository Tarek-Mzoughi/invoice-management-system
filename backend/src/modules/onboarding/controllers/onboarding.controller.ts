import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseUserDto } from 'src/modules/user-management/dtos/user/response-user.dto';
import { toDto } from 'src/shared/database/utils/dtos';
import { AdvancedRequest } from 'src/types';
import { CompleteCompanyOnboardingDto } from '../dtos/company-onboarding.dto';
import { OnboardingService } from '../services/onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth('access_token')
@Controller({
  version: '1',
  path: '/onboarding',
})
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('/company')
  async completeCompanyOnboarding(
    @Body() dto: CompleteCompanyOnboardingDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto> {
    return toDto(
      ResponseUserDto,
      await this.onboardingService.completeCompanyOnboarding(req.user.sub, dto),
    );
  }
}
