'use strict';

const transformCreateInput = (rawData) => ({
  firstName: rawData.firstName?.trim(),
  lastName: rawData.lastName?.trim(),
  email: rawData.email?.toLowerCase().trim(),
  username: rawData.username?.toLowerCase().trim(),
  phone: rawData.phone?.trim() || null,
});

const transformUpdateInput = (rawData) => {
  const transformed = {};
  if (rawData.firstName !== undefined) {
    transformed.firstName = rawData.firstName.trim();
  }
  if (rawData.lastName !== undefined) {
    transformed.lastName = rawData.lastName.trim();
  }
  if (rawData.username !== undefined) {
    transformed.username = rawData.username.toLowerCase().trim();
  }
  if (rawData.phone !== undefined) {
    transformed.phone = rawData.phone?.trim() || null;
  }
  if (rawData.avatar !== undefined) {
    transformed.avatar = rawData.avatar;
  }
  return transformed;
};

module.exports = { transformCreateInput, transformUpdateInput };
