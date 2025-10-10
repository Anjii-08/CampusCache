import Report from '../models/Report.js';

export const createReport = async (request, response) => {
    const { userId,contentId, contentType, reasons} = request.body;

    if (!userId || !contentId || !contentType || !reasons) {
        return response.status(400).json({ success: false, message: "Missing required report details." });
    }

    try {
        // Check for existing pending report by the same user on the same content
        const existingReport = await Report.findOne({ reportedBy: userId, contentId});
        if (existingReport) {
            return response.status(400).json({ success: false, message: "You have already reported this content and it is under review." });
        }
        const newReport = new Report({
            ...request.body,
            reportedBy: userId,
            status: 'Pending'
        });

        await newReport.save();
        return response.status(201).json({ success: true, message: "Report submitted successfully." });

    } catch (error) {
        return response.status(500).json({ success: false, message: error.message });
    }
};