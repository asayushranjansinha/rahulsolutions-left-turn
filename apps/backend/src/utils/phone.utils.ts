import {
  CountryCode,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from 'libphonenumber-js/max';
import { BadRequestError } from './app-error.js';

export interface PhoneValidationOptions {
  defaultCountry?: CountryCode;
  strictValidation?: boolean;
}

export const DEFAULT_VALIDATION_OPTIONS: Required<PhoneValidationOptions> = {
  defaultCountry: 'IN',
  strictValidation: true,
};

/**
 * Cleans phone input by removing unwanted characters.
 */
export const cleanPhoneInput = (raw: string): string => {
  if (typeof raw !== 'string') return '';

  return raw
    .trim()
    .replace(/[\s\-\(\)\[\]\.]/g, '') // Remove spaces, dashes, brackets, dots
    .replace(/[^\d\+]/g, ''); // Keep digits & plus
};

/**
 * Validates and normalizes to E.164.
 */
export const validateAndNormalizePhone = (
  raw: string,
  options: PhoneValidationOptions = {}
): string => {
  const config = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const cleaned = cleanPhoneInput(raw);

  if (!cleaned) {
    throw new BadRequestError('Phone number cannot be empty');
  }

  if (!isPossiblePhoneNumber(cleaned, config.defaultCountry)) {
    throw new BadRequestError('Phone number format is not valid');
  }

  if (
    config.strictValidation &&
    !isValidPhoneNumber(cleaned, config.defaultCountry)
  ) {
    throw new BadRequestError('Phone number is not valid');
  }

  const phoneNumber = parsePhoneNumberWithError(cleaned, config.defaultCountry);

  if (!phoneNumber?.isValid()) {
    throw new BadRequestError('Unable to parse phone number');
  }

  if (phoneNumber.country === 'IN') {
    const nationalNumber = phoneNumber.nationalNumber.toString();
    const firstDigit = nationalNumber[0];
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      throw new BadRequestError(
        'Invalid Indian mobile number prefix (must start with 6-9)'
      );
    }
  }

  return phoneNumber.number; // E.164
};
