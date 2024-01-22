import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { getBankNameFromCardNumber, isShebaValid, verifyCardNumber } from "@persian-tools/persian-tools";

// READ
export const getBankInfo = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const bank = await shopModel.findOne({ userId }, { bankInfo: 1 });
    if (!bank) throw { message: `Bank Info Not Found` };
    return res.status(200).json(bank);
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateBankInfo = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { cardNumber, accountNumber } = req.body;
    if (!cardNumber) throw { message: `Card Number Is a Required Field` };
    if (!accountNumber) throw { message: `Account Number Is a Required Field` };
    if (!verifyCardNumber(cardNumber))
      throw { message: `Your Card Number Is Not Valid` };
    if (!isShebaValid(`IR${accountNumber}`))
      throw { message: `Your Account Number Is Not Valid` };
    await shopModel.updateOne(
      { userId },
      {
        $set: {
          bankInfo: {
            cardNumber: cardNumber,
            accountNumber: accountNumber,
            bankName: getBankNameFromCardNumber(cardNumber),
          },
        },
      }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Your Bank Info Updated`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};