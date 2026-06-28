import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ActivityEntity } from 'src/modules/activity/entities/activity.entity';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { CountryEntity } from 'src/modules/country/entities/country.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { AddressEntity } from 'src/modules/address/entities/address.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { CABINET_INVOICE_DISPLAY_TYPE } from '../enums/cabinet-invoice-display-type.enum';

export interface CabinetTaxSettings extends Record<string, unknown> {
  vatRates?: number[];
  additionalTaxes?: string[];
}

@Entity('cabinet')
export class CabinetEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  enterpriseName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'boolean', default: false })
  isPerson: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'json', nullable: true })
  phoneNumbers: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxIdNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  activityType: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  personType: string;

  @Column({ type: 'json', nullable: true })
  taxSettings: CabinetTaxSettings;

  @Column({ type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  onboardingCompletedAt: Date;

  @ManyToOne(() => ActivityEntity)
  @JoinColumn({ name: 'activityId' })
  activity: ActivityEntity;

  @Column({ type: 'int', nullable: true })
  activityId: number;

  @ManyToMany(() => ActivityEntity)
  @JoinTable({
    name: 'cabinet_activities_activity',
    joinColumn: { name: 'cabinetId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activityId', referencedColumnName: 'id' },
  })
  activities: ActivityEntity[];

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  currencyId: number;

  @ManyToOne(() => CountryEntity)
  @JoinColumn({ name: 'countryId' })
  country: CountryEntity;

  @Column({ type: 'int', nullable: true })
  countryId: number;

  @Column({
    type: 'enum',
    enum: CABINET_INVOICE_DISPLAY_TYPE,
    default: CABINET_INVOICE_DISPLAY_TYPE.INVOICE,
  })
  invoiceDisplayType: CABINET_INVOICE_DISPLAY_TYPE;

  @ManyToOne(() => AddressEntity)
  @JoinColumn({ name: 'addressId' })
  address: AddressEntity;

  @Column({ type: 'int', nullable: true })
  addressId: number;

  @ManyToOne(() => AddressEntity)
  @JoinColumn({ name: 'deliveryAddressId' })
  deliveryAddress: AddressEntity;

  @Column({ type: 'int', nullable: true })
  deliveryAddressId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'logoId' })
  logo: StorageEntity;

  @Column({ type: 'int', nullable: true })
  logoId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'signatureId' })
  signature: StorageEntity;

  @Column({ type: 'int', nullable: true })
  signatureId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'stampId' })
  stamp: StorageEntity;

  @Column({ type: 'int', nullable: true })
  stampId: number;
}
