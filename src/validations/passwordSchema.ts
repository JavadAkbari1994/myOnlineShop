import * as yup from "yup";

const passwordSchema = yup.object({
  password: yup
    .string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$*%?]{8,}$/,
      `Your Password Must Be Minimum Eight Characters, At Least One Uppercase Letter, One Lowercase Letter One Number And If You Want Special Characters: ' ! @ # $ * % ? '`
    )
    .required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], `Passwords Don't Match`)
    .required(),
});

export { passwordSchema };
