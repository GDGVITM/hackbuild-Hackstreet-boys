// functions/index.js
const functions = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {setGlobalOptions} = require("firebase-functions/v2");
const {PDFDocument, StandardFonts} = require("pdf-lib");
const admin = require("firebase-admin");
const axios = require("axios");
const logger = require("firebase-functions/logger");

setGlobalOptions({region: "asia-northeast1"});

admin.initializeApp();

// V2 HTTPS Callable function
exports.generateResumePDF = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in.",
    );
  }

  const {
    name,
    email,
  } = request.data;
  const uid = request.auth.uid;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(`Name: ${name}`, {x: 50, y: 750, font, size: 20});
  page.drawText(`Email: ${email}`, {x: 50, y: 720, font, size: 12});

  const pdfBytes = await pdfDoc.save();
  const bucket = admin.storage().bucket();
  const filePath = `resumes/${uid}/${Date.now()}_resume.pdf`;
  const file = bucket.file(filePath);
  await file.save(Buffer.from(pdfBytes));

  await admin.firestore().collection("users").doc(uid).collection("resumes")
      .add({
        ...request.data,
        pdfPath: filePath,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

  return {success: true, message: "Resume saved!"};
});

// V2 Storage Triggered function
exports.parseResume = onObjectFinalized({cpu: 2}, async (event) => {
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  logger.log("File detected in storage:", filePath);

  if (!contentType.startsWith("application/pdf")) {
    return logger.log("This is not a PDF.");
  }
  if (!filePath.startsWith("uploads/")) {
    return logger.log("Not a file in the uploads directory.");
  }

  const uid = filePath.split("/")[1];
  const bucket = admin.storage().bucket(fileBucket);

  const [fileUrl] = await bucket.file(filePath).getSignedUrl({
    action: "read",
    expires: "2029-12-31",
  });

  const options = {
    method: "POST",
    url: "https://api.edenai.run/v2/ocr/resume_parser",
    headers: {
      "authorization": `Bearer ${functions.config().edenai.key}`,
    },
    data: {
      "providers": "affinda",
      "file_url": fileUrl,
      "fallback_providers": "",
    },
  };

  try {
    const response = await axios.request(options);
    const parsedData = response.data["affinda"].extracted_data;
    const score = 78;

    await admin.firestore().collection("users").doc(uid)
        .collection("parsedResumes").add({
          originalFile: filePath,
          parsedData: parsedData,
          score: score,
          analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    logger.log("Successfully parsed and saved resume for user:", uid);
  } catch (error) {
    logger.error("Error parsing resume:", error);
  }
});
