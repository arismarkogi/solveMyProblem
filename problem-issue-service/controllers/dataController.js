const Data = require('../models/dataModel');
const User = require('../models/userModel');
const sendToQueue = require('../utils/rabbitmq');
const fs = require('fs');
const path = require('path');

const submitData = async (req, res) => {
    try {
        const { numVehicles, depot, maxDistance, userId } = req.body;
        const locationFile = req.files['location'][0].path;
        const pythonFile = req.files['python'][0].path;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.creditAmount <= 0) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const command = `python3 ${path.basename(pythonFile)} ${path.basename(locationFile)} ${numVehicles} ${depot} ${maxDistance}`;
        
        // Deduct one credit from the user
        user.creditAmount -= 1;
        await user.save();

        const newData = new Data({
            userId,
            command,
            locationFile,
            pythonFile
        });

        await newData.save();

        // Verify that files exist before reading them
        if (!fs.existsSync(locationFile) || !fs.existsSync(pythonFile)) {
            return res.status(500).json({ error: 'File upload failed' });
        }

        const message = {
            userId,
            numVehicles,
            depot,
            maxDistance,
            locationFileContent: fs.readFileSync(locationFile, 'utf-8'),
            pythonFileContent: fs.readFileSync(pythonFile, 'utf-8'),
            locationFileName: path.basename(locationFile),
            pythonFileName: path.basename(pythonFile),
            command
        };

        await sendToQueue('task_queue', message);

        res.status(200).json({ message: 'Data submitted and sent to queue' });
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ error: 'Error submitting data' });
    }
};

module.exports = { submitData };


/*
const submitData = async (req, res) => {
    try {
        const { numVehicles, depot, maxDistance, userId } = req.body;
        const locationFile = req.files['location'][0].path;
        const pythonFile = req.files['python'][0].path;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.creditAmount <= 0) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const command = `python3 ${pythonFile} ${locationFile} ${numVehicles} ${depot} ${maxDistance}`;
        
        // Deduct one credit from the user
        user.creditAmount -= 1;
        await user.save();

        const newData = new Data({
            userId,
            command,
            locationFile,
            pythonFile
        });

        await newData.save();

        // Verify that files exist before reading them
        if (!fs.existsSync(locationFile) || !fs.existsSync(pythonFile)) {
            return res.status(500).json({ error: 'File upload failed' });
        }

        const message = {
            userId,
            numVehicles,
            depot,
            maxDistance,
            locationFile: fs.readFileSync(locationFile, 'utf-8'),
            pythonFile: fs.readFileSync(pythonFile, 'utf-8'),
            command
        };

        await sendToQueue('task_queue', message);

        res.status(200).json({ message: 'Data submitted and sent to queue' });
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ error: 'Error submitting data' });
    }
};

module.exports = { submitData };
*/

