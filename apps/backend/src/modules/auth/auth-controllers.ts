import { UserRole } from '@prisma/client';

import { logger } from '@/config/logger-config';
import { ForbiddenError, TemporaryServerError } from '@/utils/app-error';
import { asyncHandler } from '@/utils/async-handler';
import { validateAndNormalizePhone } from '@/utils/phone.utils';
import { create, getByWhere, update } from './auth.services';
import { authSchema } from './auth.validations';

export const loginOrSignup = asyncHandler(async (req, res) => {
  const { phoneNumber, expoPushToken } = req.body;
  
  logger.info(`AuthController: loginOrSignup → Phone: ${phoneNumber}`);
  console.log(req.body);
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    logger.warn(
      `AuthController: loginOrSignup → Validation failed: ${phoneNumber}`
    );
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: issues,
    });
  }

  const normalizedPhone = validateAndNormalizePhone(phoneNumber);

  let user = null;

  user = await getByWhere({ phoneNumber: normalizedPhone });

  if (!user) {
    logger.debug(
      `AuthController: loginOrSignup → Creating new user: ${phoneNumber}`
    );
    user = await create(
      { phoneNumber: normalizedPhone, expoPushToken },
      UserRole.STUDENT
    );
  } else {
    logger.debug(
      `AuthController: loginOrSignup → User exists: ${user.phoneNumber}`
    );
    if (!user.isActive) {
      logger.info(
        `AuthController: loginOrSignup → Blocked user tried to login: ${user.phoneNumber}`
      );
      throw new ForbiddenError('Your account has been blocked by an admin.');
    }
    logger.debug(
      `AuthController: loginOrSignup → Updating user: ${user.phoneNumber}`
    );
    user = await update(normalizedPhone, expoPushToken);
  }

  if (!user) {
    throw new TemporaryServerError(
      'Unable to process user request at the moment. Please try again later.'
    );
  }

  return res.status(200).json({
    data: user,
    message: 'User authenticated successfully',
  });
});
