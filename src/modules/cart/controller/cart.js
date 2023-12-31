import { StatusCodes } from "http-status-codes";
import productModel from "../../../../DB/models/product.model.js";
import { ErrorClass } from "../../../utils/errorClass.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cartModel from "../../../../DB/models/cart.model.js";




export const addCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity, size, color } = req.body
    const product = await productModel.findOne({ _id: productId })
    if (!product) {
        return next(new ErrorClass(`This product not Exist!`, StatusCodes.NOT_FOUND))
    }
    if (product.stock < quantity) {
        await productModel.updateOne({ _id: productId }, {
            $addToSet: {
                wishList: req.user._id
            }
        })
        return next(new ErrorClass(`Out Of Stock`, StatusCodes.BAD_REQUEST))
    }
    const foundItem = product.details.find(item => 
        item.size === size &&
        item.quantity >= quantity &&
        item.colors.includes(color)
    );
    if(!foundItem){
        return next(new ErrorClass(`This Size not available`, StatusCodes.BAD_REQUEST))
    }
    const cart = await cartModel.findOne({ userId: req.user._id })
    //if not found findIndex return -1
    //if found findIndex return  0
    const productIndex = cart.products.findIndex((product => {
        return (product.productId == productId&&product.size == size&&product.color == color)
    }))

    if (productIndex == -1) {
        cart.products.push({
            productId,
            quantity,
            size,
            color
        })
    } else {
        cart.products[productIndex].quantity = cart.products[productIndex].quantity + quantity
    }
    await cart.save()
    return res.status(StatusCodes.CREATED).json({ message: 'Done', cart })
})


export const deleteFromCart = asyncHandler(async (req, res, next) => {
    const { id } = req.params; 
    const productExist = await productModel.findOne({
        _id: id
    })
    if (!productExist) {
        return next(new ErrorClass(`This Product not Exist!`, StatusCodes.NOT_FOUND))
    }
    const userCart = await cartModel.findOne({
        userId: req.user._id,
        'products.productId': id
    })
    if (!userCart) {
        return next(new ErrorClass(`This Product not Exist in userCart!`, StatusCodes.NOT_FOUND))
    }
    userCart.products.forEach(element => {
        if (element.productId == id) {
            userCart.products.splice(userCart.products.indexOf(element), 1)
        }
    })
    userCart.save()
    return res.status(StatusCodes.OK).json({ message: "Done", userCart })
})

export const getUserCart = asyncHandler(async (req, res, next) => {

    const userCart = await cartModel.findOne({ userId: req.user._id })
    .select('size quantity color products')
        .populate([{
            path: 'products.productId',
            select: 'name price discount paymentPrice description image -_id',
            populate: [
                {
                    path: 'subcategoryId',
                    select: 'name -_id'
                }
            ]
        }])

    let totalPrice = 0

    userCart.products.filter(element => {
        if (element?.productId) {
            totalPrice += (element.productId.paymentPrice * element.quantity)
            return element
        }
    })
    await userCart.save()
    return res.status(StatusCodes.OK).json({ message: 'Done', userCart, totalPayment: totalPrice })
})