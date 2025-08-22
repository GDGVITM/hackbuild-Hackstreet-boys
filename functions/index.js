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

// --- ADD THIS NEW FUNCTION ---

exports.getCareerGuidance = onCall(async (request) => {
  // 1. Check for authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const userSkills = request.data.skills;
  if (!userSkills) {
    throw new HttpsError("invalid-argument", "The function must be called with a 'skills' argument.");
  }

  // 2. Find relevant jobs using the JSearch API
  const jobsOptions = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      query: `Software Developer with ${userSkills} in India`,
      num_pages: '1'
    },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  let jobDescriptions = '';
  try {
    const response = await axios.request(jobsOptions);
    // Combine the first 5 job descriptions into one text block
    jobDescriptions = response.data.data.slice(0, 5).map(job => job.job_description).join("\n\n---\n\n");
  } catch (error) {
    console.error("Error fetching jobs from JSearch API:", error);
    throw new HttpsError("internal", "Failed to fetch job data.");
  }

  // 3. Analyze the data with the Gemini API
  const geminiApiKey = process.env.GEMINI_KEY;
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

  const prompt = `
    Based on a user with the skills "${userSkills}" and the following real job descriptions, provide career guidance.
    
    Job Descriptions:
    ---
    ${jobDescriptions}
    ---

    Respond ONLY in JSON format with the following structure: 
    {
      "strongest_skills": ["skill1", "skill2"],
      "skill_gaps": ["skill_A", "skill_B"],
      "suggested_roles": ["role1", "role2"],
      "project_ideas": [
        {"title": "Project Title 1", "description": "A brief description."},
        {"title": "Project Title 2", "description": "A brief description."}
      ]
    }
    
    - "strongest_skills": Identify the top 3-5 skills the user has that are most mentioned in the jobs.
    - "skill_gaps": Identify the top 3 skills frequently required by the jobs that the user is missing.
    - "suggested_roles": Suggest 2-3 specific job titles the user should search for.
    - "project_ideas": Suggest 2 creative but achievable project ideas the user could build to fill their skill gaps.
  `;

  try {
    const response = await axios.post(geminiApiUrl, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    const guidanceJson = response.data.candidates[0].content.parts[0].text;
    // The line below is where the error likely was. It's now fixed.
    return JSON.parse(guidanceJson); 
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    throw new HttpsError("internal", "Failed to get AI guidance.");
  }
});


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
