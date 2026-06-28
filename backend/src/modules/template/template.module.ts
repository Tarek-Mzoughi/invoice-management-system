import { Module } from '@nestjs/common';
import { TemplateCategoryService } from './services/template-category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateCategoryEntity } from './entities/template-category.entity';
import { TemplateCategoryRepository } from './repositories/template-category.repository';

@Module({
  controllers: [],
  providers: [TemplateCategoryRepository, TemplateCategoryService],
  exports: [TemplateCategoryRepository, TemplateCategoryService],
  imports: [TypeOrmModule.forFeature([TemplateCategoryEntity])],
})
export class TemplateModule {}
