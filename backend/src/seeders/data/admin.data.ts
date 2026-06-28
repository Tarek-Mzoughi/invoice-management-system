import { CreateProfileDto } from 'src/modules/user-management/dtos/profile/create-profile.dto';
import { CreateUserDto } from 'src/modules/user-management/dtos/user/create-user.dto';
import { Gender } from 'src/modules/user-management/enums/gender.enum';

export const adminSeed: { core: CreateUserDto; profile: CreateProfileDto } = {
  core: {
    username: 'superadmin',
    email: 'superadmin@example.com',
    password: 'superpassword',
    isActive: true,
    isApproved: true,
    firstName: 'Super$',
    lastName: 'Admin$',
  },
  profile: {
    bio: 'I am a super admin',
    cin: '123456789',
    gender: Gender.Male,
    isPrivate: false,
  },
};
