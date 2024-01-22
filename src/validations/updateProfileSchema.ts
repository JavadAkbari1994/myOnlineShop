import * as yup from "yup";

const updateProfileSchema = yup.object({
  fName: yup.string(),
  lName: yup.string(),
  email: yup
    .string()
    .matches(
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      `The Email That You Entered Is Not a Valid Email Address`
    )
});

export { updateProfileSchema };
