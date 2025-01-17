const jwt = require('jsonwebtoken');
const { sendToQueue, responseMap } = require('../utils/rabbitmq');
const { v4: uuidv4 } = require('uuid');


exports.updateUser = async (req, res) => {
    try {
        const {userId, username, password, email } = req.body;

        if(!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        const correlationId = uuidv4();


        const message = {
            headers: {
                origin : `Bearer ${jwt.sign({origin : process.env.ORIGIN }, process.env.JWT_SECRET_ORIGIN_KEY)}`,
            },
            type: "update",
            mes: {
                correlationId,
                userId,
                username,
                password,
                email
            }
        };
        responseMap.set(correlationId, res);

        await sendToQueue('user-service-queue', message);
        
    } catch (error) {
        console.error('Internal Error', error);
        res.status(500).json({ error: 'Internal Error' });
    }
};
