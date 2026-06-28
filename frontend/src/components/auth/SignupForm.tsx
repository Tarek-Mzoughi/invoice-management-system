import { ArrowLeft, ArrowRight, Check, ImagePlus, UserCircle, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { defineStepper } from '@/components/ui/stepper';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Gender } from '@/types';
import { getPasswordValidationKey } from '@/utils/password.utils';

interface SignupFormProps {
  className?: string;
  onSubmit: (data: SignupFormData) => void;
  isPending: boolean;
  onBackToLogin: () => void;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  profilePicture?: File;
  phone?: string;
  cin?: string;
  bio?: string;
  gender?: Gender;
  isPrivate?: boolean;
}

type SignupField = keyof SignupFormData | 'terms';

const { Stepper, utils } = defineStepper(
  { id: 'account', title: 'Account', description: 'Create your account' },
  { id: 'personal', title: 'Personal info', description: 'Basic information' },
  { id: 'profile', title: 'Profile', description: 'Additional details' },
  { id: 'review', title: 'Review', description: 'Confirm your details' }
);

const initialFormData: SignupFormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  cin: '',
  bio: '',
  isPrivate: false
};

const getAge = (date: Date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

export const SignupForm = ({ className, onSubmit, isPending, onBackToLogin }: SignupFormProps) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = React.useState<SignupFormData>(initialFormData);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [profilePreview, setProfilePreview] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<SignupField, string>>>({});

  const updateField = <T extends keyof SignupFormData>(field: T, value: SignupFormData[T]) => {
    setFormData((current) => {
      const updated = { ...current, [field]: value };
      
      // Dynamically clear match error if passwords now match
      if ((field === 'password' || field === 'confirmPassword') && updated.password === updated.confirmPassword) {
        setErrors((errs) => ({ ...errs, confirmPassword: undefined }));
      }
      
      return updated;
    });

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateAccountStep = () => {
    const nextErrors: Partial<Record<SignupField, string>> = {};
    const username = formData.username.trim();
    const email = formData.email.trim();

    if (username.length < 3) {
      nextErrors.username = t('auth.validation.username_min_length');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      nextErrors.username = t('auth.validation.username_format');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = t('auth.validation.invalid_email');
    }

    const passwordValidationKey = getPasswordValidationKey(formData.password);
    if (passwordValidationKey) {
      nextErrors.password = t(`auth.validation.${passwordValidationKey}`);
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t('auth.validation.passwords_do_not_match');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePersonalStep = () => {
    const nextErrors: Partial<Record<SignupField, string>> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = t('auth.validation.first_name_required');
    if (!formData.lastName.trim()) nextErrors.lastName = t('auth.validation.last_name_required');
    if (formData.dateOfBirth && getAge(formData.dateOfBirth) < 13) {
      nextErrors.dateOfBirth = t('auth.validation.age_minimum');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateReviewStep = () => {
    if (!termsAccepted) {
      setErrors({ terms: t('auth.validation.terms_required') });
      toast.error(t('auth.validation.terms_required'));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validateAccountStep() || !validatePersonalStep() || !validateReviewStep()) return;

    onSubmit({
      ...formData,
      username: formData.username.trim(),
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone?.trim(),
      cin: formData.cin?.trim(),
      bio: formData.bio?.trim()
    });
  };

  return (
    <div className={cn('flex w-full max-w-2xl flex-col gap-6', className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t('auth.signup_title')}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {t('auth.signup_description')}
        </p>
      </div>

      <Stepper.Provider labelOrientation="vertical">
        {({ methods }: { methods: any }) => (
          <>
            <Stepper.Navigation className="mb-2">
              <Stepper.Step
                of="account"
                icon={
                  utils.getIndex(methods.current.id) > utils.getIndex('account') ? (
                    <Check className="size-4" />
                  ) : undefined
                }>
                <Stepper.Title>{t('auth.signup_steps.account')}</Stepper.Title>
                <Stepper.Description>{t('auth.signup_steps.account_description')}</Stepper.Description>
              </Stepper.Step>
              <Stepper.Step
                of="personal"
                icon={
                  utils.getIndex(methods.current.id) > utils.getIndex('personal') ? (
                    <Check className="size-4" />
                  ) : undefined
                }>
                <Stepper.Title>{t('auth.signup_steps.personal')}</Stepper.Title>
                <Stepper.Description>{t('auth.signup_steps.personal_description')}</Stepper.Description>
              </Stepper.Step>
              <Stepper.Step
                of="profile"
                icon={
                  utils.getIndex(methods.current.id) > utils.getIndex('profile') ? (
                    <Check className="size-4" />
                  ) : undefined
                }>
                <Stepper.Title>{t('auth.signup_steps.profile')}</Stepper.Title>
                <Stepper.Description>{t('auth.signup_steps.profile_description')}</Stepper.Description>
              </Stepper.Step>
              <Stepper.Step of="review">
                <Stepper.Title>{t('auth.signup_steps.review')}</Stepper.Title>
                <Stepper.Description>{t('auth.signup_steps.review_description')}</Stepper.Description>
              </Stepper.Step>
            </Stepper.Navigation>

            {methods.current.id === 'account' && (
              <AccountStep
                formData={formData}
                errors={errors}
                isPending={isPending}
                onChange={updateField}
              />
            )}

            {methods.current.id === 'personal' && (
              <PersonalStep
                formData={formData}
                errors={errors}
                isPending={isPending}
                profilePreview={profilePreview}
                onChange={updateField}
                onPreviewChange={setProfilePreview}
              />
            )}

            {methods.current.id === 'profile' && (
              <ProfileStep
                formData={formData}
                errors={errors}
                isPending={isPending}
                onChange={updateField}
              />
            )}

            {methods.current.id === 'review' && (
              <ReviewStep
                formData={formData}
                profilePreview={profilePreview}
                termsAccepted={termsAccepted}
                termsError={errors.terms}
                isPending={isPending}
                onTermsChange={(checked) => {
                  setTermsAccepted(checked);
                  if (errors.terms) setErrors((current) => ({ ...current, terms: undefined }));
                }}
              />
            )}

            <div className="mt-2 flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => methods.prev()}
                disabled={utils.getFirst().id === methods.current.id || isPending}>
                <ArrowLeft className="mr-2 size-4" />
                {t('commands.back')}
              </Button>

              {utils.getLast().id === methods.current.id ? (
                <Button type="button" onClick={handleSubmit} disabled={isPending || !termsAccepted}>
                  {t('auth.signup_action')}
                  <Spinner show={isPending} className="ml-2" size="small" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    const canContinue =
                      methods.current.id === 'account'
                        ? validateAccountStep()
                        : methods.current.id === 'personal'
                          ? validatePersonalStep()
                          : true;

                    if (canContinue) methods.next();
                  }}
                  disabled={isPending}>
                  {t('pagination.next')}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </Stepper.Provider>

      <div className="text-center text-sm text-muted-foreground">
        {t('auth.has_account')}{' '}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-primary underline-offset-4 transition-colors hover:underline">
          {t('auth.go_login')}
        </button>
      </div>
    </div>
  );
};

interface StepProps {
  formData: SignupFormData;
  errors?: Partial<Record<SignupField, string>>;
  isPending: boolean;
  onChange: <T extends keyof SignupFormData>(field: T, value: SignupFormData[T]) => void;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;

const AccountStep = ({ formData, errors, isPending, onChange }: StepProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="signup-username">{t('auth.username')}</Label>
        <Input
          id="signup-username"
          value={formData.username}
          onChange={(event) => onChange('username', event.target.value)}
          disabled={isPending}
          autoComplete="username"
          placeholder={t('auth.username_placeholder')}
        />
        <FieldError message={errors?.username} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-email">{t('auth.email')}</Label>
        <Input
          id="signup-email"
          type="email"
          value={formData.email}
          onChange={(event) => onChange('email', event.target.value)}
          disabled={isPending}
          autoComplete="email"
          placeholder={t('auth.email_placeholder')}
        />
        <FieldError message={errors?.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password">{t('auth.password')}</Label>
          <Input
            id="signup-password"
            type="password"
            value={formData.password}
            onChange={(event) => onChange('password', event.target.value)}
            disabled={isPending}
            autoComplete="new-password"
            placeholder={t('auth.password_placeholder')}
          />
          <FieldError message={errors?.password} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-confirm-password">{t('auth.confirm_password')}</Label>
          <Input
            id="signup-confirm-password"
            type="password"
            value={formData.confirmPassword}
            onChange={(event) => onChange('confirmPassword', event.target.value)}
            disabled={isPending}
            autoComplete="new-password"
            placeholder={t('auth.confirm_password_placeholder')}
          />
          <FieldError message={errors?.confirmPassword} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{t('auth.password_hint')}</p>
    </div>
  );
};

interface PersonalStepProps extends StepProps {
  profilePreview: string | null;
  onPreviewChange: (value: string | null) => void;
}

const PersonalStep = ({
  formData,
  errors,
  isPending,
  profilePreview,
  onChange,
  onPreviewChange
}: PersonalStepProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="grid gap-4">
      <ProfilePictureUpload
        profilePreview={profilePreview}
        disabled={isPending}
        onPictureChange={(file) => {
          onChange('profilePicture', file);
          if (!file) {
            onPreviewChange(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => onPreviewChange(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-first-name">{t('auth.first_name')}</Label>
          <Input
            id="signup-first-name"
            value={formData.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            disabled={isPending}
            autoComplete="given-name"
            placeholder={t('auth.first_name_placeholder')}
          />
          <FieldError message={errors?.firstName} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-last-name">{t('auth.last_name')}</Label>
          <Input
            id="signup-last-name"
            value={formData.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            disabled={isPending}
            autoComplete="family-name"
            placeholder={t('auth.last_name_placeholder')}
          />
          <FieldError message={errors?.lastName} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t('auth.date_of_birth')}</Label>
        <DatePicker
          value={formData.dateOfBirth}
          onChange={(date) => onChange('dateOfBirth', date)}
          isPending={isPending}
        />
        <FieldError message={errors?.dateOfBirth} />
      </div>
    </div>
  );
};

const ProfileStep = ({ formData, errors, isPending, onChange }: StepProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="grid gap-4">
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.optional_profile_fields')}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-phone">{t('auth.phone')}</Label>
          <Input
            id="signup-phone"
            type="tel"
            value={formData.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            disabled={isPending}
            autoComplete="tel"
            placeholder={t('auth.phone_placeholder')}
          />
          <FieldError message={errors?.phone} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-cin">{t('auth.cin')}</Label>
          <Input
            id="signup-cin"
            value={formData.cin}
            onChange={(event) => onChange('cin', event.target.value)}
            disabled={isPending}
            placeholder={t('auth.cin_placeholder')}
          />
          <FieldError message={errors?.cin} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-bio">{t('auth.bio')}</Label>
        <Textarea
          id="signup-bio"
          value={formData.bio}
          onChange={(event) => onChange('bio', event.target.value)}
          disabled={isPending}
          rows={3}
          className="resize-none"
          placeholder={t('auth.bio_placeholder')}
        />
        <FieldError message={errors?.bio} />
      </div>
      <div className="grid gap-2">
        <Label>{t('auth.gender')}</Label>
        <RadioGroup
          value={formData.gender || ''}
          onValueChange={(value) => onChange('gender', value as Gender)}
          disabled={isPending}
          className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value={Gender.Male} id="signup-gender-male" />
            <Label htmlFor="signup-gender-male" className="cursor-pointer font-normal">
              {t('auth.gender_male')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value={Gender.Female} id="signup-gender-female" />
            <Label htmlFor="signup-gender-female" className="cursor-pointer font-normal">
              {t('auth.gender_female')}
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <Label htmlFor="signup-is-private">{t('auth.is_private')}</Label>
          <p className="text-sm text-muted-foreground">{t('auth.is_private_description')}</p>
        </div>
        <Switch
          id="signup-is-private"
          checked={formData.isPrivate}
          onCheckedChange={(checked) => onChange('isPrivate', checked)}
          disabled={isPending}
        />
      </div>
    </div>
  );
};

interface ReviewStepProps {
  formData: SignupFormData;
  profilePreview: string | null;
  termsAccepted: boolean;
  termsError?: string;
  isPending: boolean;
  onTermsChange: (checked: boolean) => void;
}

const ReviewStep = ({
  formData,
  profilePreview,
  termsAccepted,
  termsError,
  isPending,
  onTermsChange
}: ReviewStepProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="grid gap-4">
      {profilePreview && (
        <div className="flex justify-center">
          <Image
            src={profilePreview}
            alt={t('auth.profile_picture')}
            width={96}
            height={96}
            className="size-24 rounded-full border-2 border-border object-cover"
          />
        </div>
      )}
      <ReviewCard title={t('auth.signup_steps.account')}>
        <ReviewRow label={t('auth.username')} value={formData.username} />
        <ReviewRow label={t('auth.email')} value={formData.email} />
      </ReviewCard>
      <ReviewCard title={t('auth.signup_steps.personal')}>
        <ReviewRow
          label={t('auth.full_name')}
          value={`${formData.firstName} ${formData.lastName}`.trim()}
        />
        <ReviewRow
          label={t('auth.date_of_birth')}
          value={formData.dateOfBirth?.toLocaleDateString()}
        />
      </ReviewCard>
      <ReviewCard title={t('auth.signup_steps.profile')}>
        <ReviewRow label={t('auth.phone')} value={formData.phone} />
        <ReviewRow label={t('auth.cin')} value={formData.cin} />
        <ReviewRow label={t('auth.gender')} value={formData.gender} />
        <ReviewRow
          label={t('auth.profile_visibility')}
          value={formData.isPrivate ? t('auth.private_profile') : t('auth.public_profile')}
        />
        {formData.bio && (
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">{t('auth.bio')}</span>
            <span className="font-medium">{formData.bio}</span>
          </div>
        )}
      </ReviewCard>
      <div className="flex items-start gap-2">
        <Checkbox
          id="signup-terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsChange(checked === true)}
          disabled={isPending}
        />
        <div className="grid gap-1">
          <Label htmlFor="signup-terms" className="text-sm font-normal">
            {t('auth.terms_acceptance')}
          </Label>
          <FieldError message={termsError} />
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3 rounded-md border p-4">
    <h3 className="font-semibold">{title}</h3>
    <div className="grid gap-2">{children}</div>
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  ) : null;

interface ProfilePictureUploadProps {
  profilePreview: string | null;
  onPictureChange: (file: File | undefined) => void;
  disabled?: boolean;
}

const ProfilePictureUpload = ({
  profilePreview,
  onPictureChange,
  disabled
}: ProfilePictureUploadProps) => {
  const { t } = useTranslation('common');
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onPictureChange(acceptedFiles[0]);
    },
    maxFiles: 1,
    maxSize: 2_000_000,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/jpg': [], 'image/webp': [] },
    disabled
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <Label className="text-center">{t('auth.profile_picture')}</Label>
      {profilePreview ? (
        <div className="relative">
          <Image
            src={profilePreview}
            alt={t('auth.profile_picture')}
            width={120}
            height={120}
            className="size-[120px] rounded-full border-2 border-border object-cover"
          />
          <Button
            size="icon"
            type="button"
            variant="destructive"
            className="absolute -right-2 -top-2 size-6 rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              onPictureChange(undefined);
            }}
            disabled={disabled}>
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <div className="flex size-[120px] items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30">
          <UserCircle className="size-16 text-muted-foreground" />
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-4 transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}>
        <input {...getInputProps()} />
        <ImagePlus className="size-5 text-muted-foreground" />
        <p className="text-center text-xs text-muted-foreground">
          {isDragActive ? t('files.drop_image') : t('files.select_image')}
        </p>
        <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP - max 2MB</p>
      </div>
    </div>
  );
};
