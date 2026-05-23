import { prisma } from '../config/database.js';
import { success, error } from "../utils/apiResponse.js";



export const generateReport = async (req, res) => {
  try {
    const { report_title, report_type, file_format, filters_applied } = req.query;

    const report = await prisma.generatedReport.create({
      data: {
        generated_by: req.user.id,
        report_title: report_title || `${report_type || "INCIDENT_SUMMARY"} Report`,
        report_type: report_type || "INCIDENT_SUMMARY",
        file_format: file_format || "CSV",
        filters_applied: filters_applied ? JSON.parse(filters_applied) : null,
        file_path: `/exports/${Date.now()}-${(file_format || "csv").toLowerCase()}.dat`,
      },
    });

    return res.status(200).json(success({ data: report, message: "Report generated" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const reportHistory = async (_req, res) => {
  try {
    const data = await prisma.generatedReport.findMany({ include: { generator: true }, orderBy: { generated_at: "desc" } });
    return res.status(200).json(success({ data, message: "Report history fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};