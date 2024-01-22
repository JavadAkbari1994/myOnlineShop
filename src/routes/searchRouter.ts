import express, { NextFunction, Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { ObjectId } from "mongodb";
import { shopModel } from "../model/shopModel";
import path from "path";

const searchRouter = express.Router();

searchRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        city,
        shop_id,
        product_id,
        title,
        category,
        sub_category,
        price,
        min_price,
        max_price,
        page,
      } = req.query;
      let pageNumber = +page || 1;
      if (!page) pageNumber = 1;
      const perPage = 10;
      let query: PipelineStage[] = [];
      if (city) {
        query.push({ $match: { city: { $regex: city, $options: "i" } } });
      }
      if (shop_id) {
        const shopId = shop_id as string | undefined;
        let shopObjectId: ObjectId | undefined = new ObjectId(
          shopId
        ) as ObjectId;
        query.push({ $match: { _id: shopObjectId } });
      }
      if (product_id) {
        const productId = product_id as string | undefined;
        let productObjectId: ObjectId | undefined = new ObjectId(
          productId
        ) as ObjectId;
        query.push({ $match: { products: productObjectId } });
      }
      query.push({
        $lookup: {
          from: "products",
          localField: "products",
          foreignField: "_id",
          as: "products",
        },
      });
      if (category) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $regexMatch: {
                    input: "$$product.service.category",
                    regex: category,
                    options: "i",
                  },
                },
              },
            },
          },
        });
      }
      if (sub_category) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $regexMatch: {
                    input: "$$product.service.subCategory",
                    regex: sub_category,
                    options: "i",
                  },
                },
              },
            },
          },
        });
      }
      if (price) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $eq: ["$$product.price", +price],
                },
              },
            },
          },
        });
      }
      if (title) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $regexMatch: {
                    input: "$$product.title",
                    regex: title,
                    options: "i",
                  },
                },
              },
            },
          },
        });
      }
      if (min_price) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $gte: ["$$product.price", +min_price],
                },
              },
            },
          },
        });
      }
      if (max_price) {
        query.push({
          $addFields: {
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: {
                  $lte: ["$$product.price", +max_price],
                },
              },
            },
          },
        });
      }

      ////// in this part i have a test that completely works when we save the url of an image after the public folder
      // const fullShopUrl = path.join(__dirname, "..", "public");
      // const fullProductUrl = path.join(__dirname, "..", "public");
      // query.push({
      //   $addFields: {
      //     "image.icon.url": { $concat: [fullShopUrl, "$image.icon.url"] },
      //     "image.wallpaper.url": {
      //       $concat: [fullShopUrl, "$image.wallpaper.url"],
      //     },
      //     "productImage.url": {
      //       $map: {
      //         input: "$products.image",
      //         as: "product_img",
      //         in: {
      //           url: { $concat: [fullProductUrl, "$$product_img.url"] },
      //         },
      //       },
      //     },
      //   },
      // });
      // query.push({
      //   $addFields: {
      //     products: {
      //       $map: {
      //         input: "$products",
      //         as: "product",
      //         in: {
      //           $mergeObjects: [
      //             "$$product",
      //             {
      //               image: {
      //                 url: {
      //                   $concat: [fullProductUrl, "$$product.image.url"],
      //                 },
      //               },
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // });
      query.push({ $match: { isActive: true } });
      query.push({
        $project: {
          shopName: 1,
          city: 1,
          images: 1,
          // "image.icon.url": 1,
          // "image.wallpaper.url": 1,
          products: {
            title: 1,
            image: 1,
            price: 1,
            details: 1,
            service: { category: 1, subCategory: 1 },
          },
        },
      });
      // next line is for when a shop does not have at least one product that has been confirmed by admins, it will not be shown 
      // query.push({ $match: { products: { $ne: [] } } });
      const findQuery = await shopModel.aggregate(query);
      const maxPages = Math.ceil(findQuery.length / perPage);
      if (pageNumber > maxPages) pageNumber = 1;
      query.push({ $skip: (pageNumber - 1) * perPage });
      query.push({ $limit: perPage });
      const result = await shopModel.aggregate(query);
      return res.status(200).json(result);
    } catch (err) {
      return next({ status: 400, err });
    }
  }
);

export { searchRouter };
