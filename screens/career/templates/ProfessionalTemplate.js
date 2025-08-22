// screens/career/templates/ProfessionalTemplate.js
export const createProfessionalTemplate = (resume, themeColor) => {
  const { personalInfo, workExperience, education, projects, skills } = resume;

  const styles = `
    <style>
      body { font-family: 'Helvetica', sans-serif; color: #4A4A4A; font-size: 10pt; background-color: #FFFFFF; }
      .container { padding: 40px; }
      .header { text-align: center; margin-bottom: 20px; }
      .name { font-size: 32pt; font-weight: bold; color: ${themeColor}; }
      .title { font-size: 12pt; margin: 5px 0; }
      .contact-container { display: flex; flex-wrap: wrap; justify-content: center; margin-top: 10px; font-size: 9pt; }
      .contact-item { margin: 0 10px; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 14pt; font-weight: bold; color: ${themeColor}; margin-bottom: 2px; }
      .section-line { height: 2px; background-color: ${themeColor}; margin-bottom: 10px; }
      .item-container { margin-bottom: 15px; }
      .item-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .item-title { font-size: 11pt; font-weight: bold; color: #2c2c2c; }
      .item-date { font-size: 10pt; }
      .item-subtitle { font-size: 10pt; font-style: italic; margin-bottom: 5px; }
      ul { padding-left: 15px; margin: 0; }
      li { margin-bottom: 5px; line-height: 1.4; }
      .skills-title { font-weight: bold; margin-top: 10px; }
    </style>
  `;

  return `
    <html>
      <head>${styles}</head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">${personalInfo.name || 'Your Name'}</div>
            <div class="title">${personalInfo.title || 'Professional Title'}</div>
            <div class="contact-container">
              <span class="contact-item">${personalInfo.email || ''}</span>
              <span class="contact-item">${personalInfo.phone || ''}</span>
              <span class="contact-item">${personalInfo.address || ''}</span>
              <span class="contact-item">${personalInfo.link || ''}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">WORK EXPERIENCE</div>
            <div class="section-line"></div>
            ${workExperience.map(exp => `
              <div class="item-container">
                <div class="item-header">
                  <div class="item-title">${exp.role || ''}</div>
                  <div class="item-date">${exp.period || ''}</div>
                </div>
                <div class="item-subtitle">${exp.company || ''}</div>
                <ul>${(exp.points || []).map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">EDUCATION</div>
            <div class="section-line"></div>
            ${education.map(edu => `
              <div class="item-container">
                <div class="item-header">
                  <div class="item-title">${edu.degree || ''}</div>
                  <div class="item-date">${edu.period || ''}</div>
                </div>
                <div class="item-subtitle">${edu.institution || ''}</div>
                <ul>${(edu.points || []).map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">PROJECTS</div>
            <div class="section-line"></div>
            ${projects.map(proj => `
              <div class="item-container">
                <div class="item-header">
                  <div class="item-title">${proj.name || ''}</div>
                  <div class="item-date">${proj.period || ''}</div>
                </div>
                <ul>${(proj.points || []).map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">SKILLS</div>
            <div class="section-line"></div>
            <p><b class="skills-title">Technical: </b>${skills.technical || ''}</p>
            <p><b class="skills-title">Soft: </b>${skills.soft || ''}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};