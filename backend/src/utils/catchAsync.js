// Wraps async route handlers to automatically catch errors and pass them to Express next()
// Eliminates the need for try/catch blocks in every controller

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;
