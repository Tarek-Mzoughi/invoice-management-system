import { AddressEntity } from 'src/modules/address/entities/address.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { DeepPartial } from 'typeorm';

export const cabinetSeederData = {
  id: 1,
  enterpriseName: 'Genesis Enterprise',
  email: 'genesis-enterprise@example.com',
  phone: '+1 (666) 666 6666',
  taxIdNumber: '666666666',
} satisfies DeepPartial<CabinetEntity>;

export const cabinetAddressSeederData = {
  address: "Boulevard de l'Indépendance",
  address2: '75007 Paris',
  region: 'Ile de France',
  zipcode: '75007',
} satisfies DeepPartial<AddressEntity>;
