import {
  Repository,
  ObjectLiteral,
  SelectQueryBuilder,
  DataSource,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
} from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {
  constructor(
    private readonly entity: new () => T,
    private readonly dataSource: DataSource,
  ) {
    super(entity, dataSource.manager);
  }

  createReadQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.createQueryBuilder(alias);
  }

  createWriteQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.createQueryBuilder(alias);
  }

  async findReadOnly(options?: FindManyOptions<T>): Promise<T[]> {
    return this.find(options ?? {});
  }

  async findOneReadOnly(options?: FindOneOptions<T>): Promise<T | null> {
    return this.findOne(options ?? {});
  }

  async saveWrite(entity: DeepPartial<T>): Promise<T> {
    const savedEntity = await this.save(entity);
    return savedEntity as T;
  }

  async updateWrite(
    criteria: FindOptionsWhere<T>,
    partialEntity: DeepPartial<T>,
  ): Promise<void> {
    await this.update(criteria, partialEntity as any);
  }

  async deleteWrite(criteria: FindOptionsWhere<T>): Promise<void> {
    await this.delete(criteria);
  }
}
