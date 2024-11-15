import * as z from "zod";
import { maximumImageSize, validImageTypes } from "../config/settings.js";

export const NewProductSchema = z.object({
  sku: z.string().min(1, {
    message: "SKU is required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
  qty: z.number().min(0, {
    message: "Quantity is required",
  }),
  description: z
    .string()
    .min(1, {
      message: "Description is required",
    })
    .max(128),
  price: z.number().min(0, {
    message: "Price is required",
  }),
  mainImageId: z.number().min(0).max(4),

  images: z.array(
    z
      .object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        buffer: z.any(),
        size: z.number(),
      })
      .refine(
        (file) => {
          return (
            validImageTypes.includes(file.mimetype) &&
            file.size <= maximumImageSize
          );
        },
        {
          message:
            "File must be an image (PNG, JPEG, WEBP, JPG) and below 50 MB",
        }
      )
  ),
});

export const UpdateProductSchema = z.object({
  sku: z.string().min(1, {
    message: "SKU is required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
  qty: z.number().min(0, {
    message: "Quantity is required",
  }),
  description: z
    .string()
    .min(1, {
      message: "Description is required",
    })
    .max(128),
  price: z.number().min(0, {
    message: "Price is required",
  }),
  newImages: z
    .array(
      z
        .object({
          fieldname: z.string(),
          originalname: z.string(),
          encoding: z.string(),
          mimetype: z.string(),
          buffer: z.any(),
          size: z.number(),
        })
        .refine(
          (file) => {
            return (
              validImageTypes.includes(file.mimetype) &&
              file.size <= maximumImageSize
            );
          },
          {
            message:
              "File must be an image (PNG, JPEG, WEBP, JPG) and below 50 MB",
          }
        )
    )
    .optional(),
  imagesToBeDeleted: z.array(z.string()).optional(),
  mainImageId: z.number().min(0).max(4).optional(),
});
