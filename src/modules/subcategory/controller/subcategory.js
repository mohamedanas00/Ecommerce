import slugify from "slugify";
import categoryModel from "../../../../DB/models/category.model.js";
import subcategoryModel from "../../../../DB/models/subcategory.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { StatusCodes } from "http-status-codes";
import { ErrorClass } from "../../../utils/errorClass.js";
import { deleteGlModel } from "../../global/handlers/delete.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";

export const addSubcategory = asyncHandler(async (req, res, next) => {
  const { name, categoryId } = req.body;
  const adminId = req.user._id;
  const isCategoryExist = await categoryModel.findById(categoryId);
  if (!isCategoryExist) {
    return next(
      new ErrorClass("CategoryId is not Exist", StatusCodes.NOT_FOUND)
    );
  }
  const isNameExist = await subcategoryModel.findOne({ name });
  if (isNameExist) {
    return next(
      new ErrorClass("Subcategory already Exist", StatusCodes.CONFLICT)
    );
  }
  const slug = slugify(name.toLowerCase());
  //secure_url public_id
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `E-commerce/subcategory/${name}` }
  );
  await subcategoryModel.create({
    name,
    categoryId,
    slug,
    createdBy: adminId,
    image: { secure_url, public_id },
  });
  return res.status(201).json({ message: "Done" });
});

//get all subcategory for specific category
export const getAllSubcategories = asyncHandler(async (req, res, next) => {
  let apiFeatures = new ApiFeatures(subcategoryModel.find(), req.query)
    .fields()
    .pagination(subcategoryModel)
    .search()
    .sort()
    .filter();
  let Subcategories = await apiFeatures.mongooseQuery.select('-categoryId -createdBy');
  res.status(StatusCodes.OK).json({
    Current_Page: apiFeatures.page,
    Next_Page: apiFeatures.next,
    Previous_Page: apiFeatures.previous,
    Total_Pages: apiFeatures.totalPages,
    subcategory_Count: apiFeatures.countDocuments,
    Subcategories,
  });
});

export const deleteSubCategory = deleteGlModel(subcategoryModel, "subcategory");

export const updateSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const isExist = await categoryModel.findById(req.body.categoryId);
  if (!isExist) {
    return next(
      new ErrorClass("This Category Not Exist!", StatusCodes.NOT_FOUND)
    );
  }
  const subIsExist = await subcategoryModel.findById(id);
  if (!subIsExist) {
    return next(
      new ErrorClass("This SubCategory Not Exist!", StatusCodes.NOT_FOUND)
    );
  }
  if (req.body.name) {
    //this name is exist in other category?
    const isNameExist = await subcategoryModel.findOne({
      name: req.body.name,
      _id: { $ne: id },
    });
    if (isNameExist) {
      return next(
        new ErrorClass(
          "This Subcategory name already Exist!",
          StatusCodes.CONFLICT
        )
      );
    }
    //add slug to body
    req.body.slug = slugify(req.body.name.toLowerCase());
  }
  if (req.file) {
    let slug;
    if (req.body.slug) {
      slug = req.body.slug;
    } else {
      slug = subIsExist.slug;
    }
    await cloudinary.uploader.destroy(subIsExist.image.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `E-commerce/subcategory/${slug}` }
    );
    //add image to body
    req.body.image = { secure_url, public_id };
  }
  await subcategoryModel.updateOne({ _id: id }, req.body);
  return res.status(200).json({ message: "Done" });
});
