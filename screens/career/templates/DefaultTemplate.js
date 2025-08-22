export const createDefaultTemplate = (resume) => {
  const { personalInfo, workExperience, education, skills, projects } = resume;
  const styles = `
    <style>
      body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 12px; }
      h1 { font-size: 28px; color: #000; margin-bottom: 5px; text-align: center; }
      h2 { font-size: 16px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
      p { margin: 2px 0; }
      .contact-info { text-align: center; margin-bottom: 15px; }
      .section-item { margin-bottom: 15px; }
      .job-title { font-size: 14px; font-weight: bold; }
      ul { padding-left: 20px; }
    </style>
  `;

  return `
    <html>
      <head>${styles}</head>
      <body>
        <h1>${personalInfo.name || 'Your Name'}</h1>
        <div class="contact-info">
          <p>${personalInfo.email || ''} | ${personalInfo.phone || ''} | ${personalInfo.address || ''} | ${personalInfo.link || ''}</p>
        </div>
        ${workExperience.length > 0 ? '<h2>Work Experience</h2>' : ''}
        ${workExperience.map(exp => `
          <div class="section-item">
            <p class="job-title">${exp.company || ''} - <i>${exp.title || ''}</i></p>
            <p><b>${exp.dates || ''}</b></p>
            <p>${exp.description || ''}</p>
          </div>
        `).join('')}
        ${education.length > 0 ? '<h2>Education</h2>' : ''}
        ${education.map(edu => `
          <div class="section-item">
            <p class="job-title">${edu.school || ''} - <i>${edu.degree || ''}</i></p>
            <p><b>${edu.dates || ''}</b></p>
          </div>
        `).join('')}
        ${skills.description ? '<h2>Skills</h2>' : ''}
        <p>${skills.description || ''}</p>
        ${projects.length > 0 ? '<h2>Projects</h2>' : ''}
        ${projects.map(proj => `
          <div class="section-item">
            <p class="job-title">${proj.name || ''}</p>
            <p>${proj.description || ''}</p>
          </div>
        `).join('')}
      </body>
    </html>
  `;
};