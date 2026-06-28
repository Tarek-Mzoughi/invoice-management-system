import { AddressEntity } from 'src/modules/address/entities/address.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('country')
export class CountryEntity extends EntityHelper {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 2, nullable: true })
  alpha2Code: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  alpha3Code: string;

  @OneToMany(() => AddressEntity, (address) => address.country)
  addresses: AddressEntity[];
}
