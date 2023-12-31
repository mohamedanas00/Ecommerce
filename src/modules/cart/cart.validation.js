import joi from "joi";
import { generalFields } from "../../middleware/validation.js";



export const addCart = {
    params: joi.object().required().keys({}),
    body: joi.object({
        productId: generalFields.id,
        quantity: joi.number().positive().required(),
        size:joi.string().required(),
        color:joi.string().required(),
    }).required(),
    query: joi.object().required().keys({}),
}


export const deleteFromCart = {
    params: joi.object({
        id: generalFields.id,
    }).required(),
    body: joi.object().required().keys({}),
    query: joi.object().required().keys({}),
}


export const getUserCart = {
    params: joi.object().required().keys({}),
    body: joi.object().required().keys({}),
    query: joi.object().required().keys({}),
}
