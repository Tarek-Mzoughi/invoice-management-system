import { Injectable } from '@nestjs/common';
import { TemplateCategoryRepository } from '../repositories/template-category.repository';
import { TemplateCategoryEntity } from '../entities/template-category.entity';
import { TemplateCategoryNotFoundException } from '../errors/template-category.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateTemplateCategoryDto } from '../dtos/template-category.create.dto';
import { TemplateCategoryAlreadyExistsException } from '../errors/template-category.alreadyexists.error';
import { UpdateTemplateCategoryDto } from '../dtos/template-category.update.dto';

@Injectable()
export class TemplateCategoryService {
  constructor(
    private readonly templateCategoryRepository: TemplateCategoryRepository,
  ) {}

  async findOneById(id: number): Promise<TemplateCategoryEntity> {
    const category = await this.templateCategoryRepository.findOneById(id);
    if (!category) {
      throw new TemplateCategoryNotFoundException();
    }
    return category;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<TemplateCategoryEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const category = await this.templateCategoryRepository.findOne(
      queryOptions as FindOneOptions<TemplateCategoryEntity>,
    );
    if (!category) return null;
    return category;
  }

  async findAll(query: IQueryObject): Promise<TemplateCategoryEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.templateCategoryRepository.findAll(
      queryOptions as FindManyOptions<TemplateCategoryEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<TemplateCategoryEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.templateCategoryRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.templateCategoryRepository.findAll(
      queryOptions as FindManyOptions<TemplateCategoryEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async save(
    createTemplateCategoryDto: CreateTemplateCategoryDto,
  ): Promise<TemplateCategoryEntity> {
    const category = await this.findOneByCondition({
      filter: `label||$eq||${createTemplateCategoryDto.label}`,
    });
    if (category) {
      throw new TemplateCategoryAlreadyExistsException();
    }
    return this.templateCategoryRepository.save(createTemplateCategoryDto);
  }

  async saveMany(
    createTemplateCategoryDtos: CreateTemplateCategoryDto[],
  ): Promise<TemplateCategoryEntity[]> {
    for (const category of createTemplateCategoryDtos) {
      const existingCategory = await this.findOneByCondition({
        filter: `label||$eq||${category.label}`,
      });
      if (existingCategory) {
        throw new TemplateCategoryAlreadyExistsException();
      }
    }
    return this.templateCategoryRepository.saveMany(createTemplateCategoryDtos);
  }

  async update(
    id: number,
    updatetemplateCategoryDto: UpdateTemplateCategoryDto,
  ): Promise<TemplateCategoryEntity> {
    const category = await this.findOneByCondition({
      filter: `label||$eq||${updatetemplateCategoryDto.label}`,
    });
    if (category) {
      throw new TemplateCategoryAlreadyExistsException();
    }
    await this.templateCategoryRepository.update(id, {
      ...updatetemplateCategoryDto,
    });
    return this.findOneById(id);
  }

  async softDelete(id: number): Promise<TemplateCategoryEntity> {
    await this.findOneById(id);
    return this.templateCategoryRepository.softDelete(id);
  }

  async getTotal(): Promise<number> {
    return this.templateCategoryRepository.getTotalCount();
  }
}
