const Transaction = require('../models/transactionModel');
const { sendToQueue } = require('../utils/rabbitmq');

const deleteUserTransactions = async (msg, channel) => {
    console.log('Received message:', msg);
    const { userId } = msg;

    if (!userId) {
        console.error('Missing required field: userId');
        const errorMessage = {
            success: false,
            message: 'Missing required field: userId'
        };
        await sendToQueue('trans_response_queue', errorMessage, channel);
        return;
    }

    try {
        // Delete all transactions associated with the user
        const result = await Transaction.deleteMany({ userId: userId });

        const successMessage = {
            userId,
            success: true,
            deletedCount: result.deletedCount,
            message: `Successfully deleted ${result.deletedCount} transaction(s) for the user`
        };
        await sendToQueue('trans_response_queue', successMessage, channel);

    } catch (error) {
        console.error('Error deleting user transactions:', error);
        const errorMessage = {
            userId,
            success: false,
            message: 'Failed to delete user transactions'
        };
        await sendToQueue('trans_response_queue', errorMessage, channel);
    }
};

module.exports = { deleteUserTransactions };