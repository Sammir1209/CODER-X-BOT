export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Accept digits, optional spaces, dashes, parentheses, length 7-15
  const re = /^[0-9\s\-()]{7,15}$/;
  return re.test(phone);
};

export const validateZip = (zip: string): boolean => {
  // US zip (5 digits) or alphanumeric 3-10 chars
  const re = /^(\d{5}(-\d{4})?|[A-Za-z0-9]{3,10})$/;
  return re.test(zip);
};

export const isValidTag = (tag: string): boolean => {
  // Allow letters, numbers, spaces, dashes, dots, underscores, and accented characters (1-100 length)
  const re = /^[A-Za-z0-9_\-\s\.áéíóúÁÉÍÓÚñÑ]{1,100}$/;
  return re.test(tag.trim());
};
