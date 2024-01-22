import * as yup from "yup";

export const serviceSignupSchema = yup.object({
  userId: yup
    .string()
    .matches(/^(09)[0-9]{9}$/, `Please Enter a Valid Phone Number`)
    .required(),
});
