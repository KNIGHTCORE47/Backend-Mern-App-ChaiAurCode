// const asyncHandler = () => {}


//NOTE - IT IS A HIGH ORDER FUNCTION
// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => {() => {}}



//NOTE - METHOD 01
// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })    
//     }
// }


//NOTE - METHOD 02
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((error) => next(error))
    }
}



export { asyncHandler } 