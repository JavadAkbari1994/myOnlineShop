import * as yup from "yup";

const signupSchema = yup.object({
  userId: yup
    .string()
    .matches(
      /^(09)[0-9]{9}$/,
      `The Phone Number That You Entered Is Not a Valid Phone Number`
    ),
  email: yup
    .string()
    .matches(
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      `The Email That You Entered Is Not a Valid Email Address`
    ),
  password: yup
    .string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$*%?]{8,}$/,
      `Your Password Must Be Minimum Eight Characters, At Least One Uppercase Letter, One Lowercase Letter One Number And If You Want One Special Characters: ' ! @ # $ * % ? '`
    ),
});

export { signupSchema };
