const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            // Join all validation errors into a single string message
            const errorMessage = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return res.status(400).json({ success: false, message: errorMessage });
        }
        next(err);
    }
};

module.exports = validate;
