const { extractSkillsFromText } = require('./skillDictionary');

function normalizeSkill(skill) {
  return skill.trim().toLowerCase();
}

function skillsMatch(resumeSkill, jobSkill) {
  const a = normalizeSkill(resumeSkill);
  const b = normalizeSkill(jobSkill);
  return a === b || a.includes(b) || b.includes(a);
}

function parseResumeText(rawText) {
  const skills = extractSkillsFromText(rawText);

  const yearsMatch = rawText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
  const years_experience = yearsMatch ? Number(yearsMatch[1]) : 0;

  const educationMatch = rawText.match(
    /(?:Bachelor|Master|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA)[^.!\n]{0,80}/i
  );
  const education = educationMatch ? educationMatch[0].trim() : '';

  const summaryMatch = rawText.match(/(?:summary|profile|objective)[:\s]*([^\n]{20,200})/i);
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : rawText.replace(/\s+/g, ' ').trim().slice(0, 200);

  return { skills, years_experience, education, summary };
}

function extractJobSkills(description) {
  return extractSkillsFromText(description);
}

function scoreSkillMatch(resumeSkills, jobSkills, language = 'en') {
  const resume = resumeSkills ?? [];
  const job = jobSkills ?? [];
  const isMyanmar = language === 'my';

  if (job.length === 0) {
    return {
      match_score: resume.length > 0 ? 75 : 50,
      missing_skills: [],
      feedback: isMyanmar
        ? 'ဤအလုပ်တွင် လိုအပ်သော ကျွမ်းကျင်မှုများ မဖော်ပြထားပါ။ AI မရရှိသောကြောင့် အခြေခံနည်းလမ်းဖြင့် CV ကို နှိုင်းယှဉ်စစ်ဆေးထားပါသည်။'
        : 'No required skills were listed for this job. Your resume was compared using a basic local matcher because the AI service was unavailable.',
    };
  }

  const missing_skills = job.filter(
    (jobSkill) => !resume.some((resumeSkill) => skillsMatch(resumeSkill, jobSkill))
  );

  const matchedCount = job.length - missing_skills.length;
  const match_score = Math.round((matchedCount / job.length) * 100);

  const gapList = missing_skills.slice(0, isMyanmar ? 5 : 6).join(', ');
  let feedback;

  if (isMyanmar) {
    if (match_score >= 75) {
      feedback = `ကိုက်ညီမှု ကောင်းပါသည် (${match_score}%)။ လိုအပ်ချက်အများစုနှင့် ကိုက်ညီပါသည်။ ${gapList || 'သင့်အားသာချက်များ'} ကို CV တွင် ထင်ရှားအောင် ဖော်ပြပါ။`;
    } else if (match_score >= 50) {
      feedback = `အသင့်အတော်က် ကိုက်ညီပါသည် (${match_score}%)။ အောက်ပါ ကျွမ်းကျင်မှုများကို တိုးတက်အောင် လုပ်ဆောင်ပါ — ${gapList || 'လိုအပ်သော ကျွမ်းကျင်မှုများ'}။`;
    } else {
      feedback = `ကိုက်ညီမှု နည်းပါးပါသည် (${match_score}%)။ လိုအပ်သော ကျွမ်းကျင်မှုများ — ${gapList || 'အများအပြား'}။ သင့်နောက်ထပ် အလုပ်ရာထူးကို ပြန်လည်ရွေးချယ်ကြည့်ပါ။`;
    }
    feedback += ' (AI မရရှိသောကြောင့် အခြေခံနည်းလမ်းဖြင့် စစ်ဆေးထားပါသည်။)';
  } else if (match_score >= 75) {
    feedback = `Strong overlap (${match_score}%). You match most required skills. Consider highlighting ${missing_skills.slice(0, 3).join(', ') || 'your top strengths'} in your application.`;
    feedback += ' (Scored with local fallback — AI quota unavailable.)';
  } else if (match_score >= 50) {
    feedback = `Moderate fit (${match_score}%). Focus on building or showcasing: ${missing_skills.slice(0, 5).join(', ') || 'additional relevant skills'}.`;
    feedback += ' (Scored with local fallback — AI quota unavailable.)';
  } else {
    feedback = `Limited overlap (${match_score}%). Key gaps include: ${missing_skills.slice(0, 6).join(', ') || 'several required skills'}. Consider upskilling or targeting roles that better align with your background.`;
    feedback += ' (Scored with local fallback — AI quota unavailable.)';
  }

  return { match_score, missing_skills, feedback };
}

function analyzeResumeMatch(
  resumeText,
  parsedExperience,
  resumeSkills,
  jobTitle,
  jobDescription,
  language = 'en'
) {
  const isMyanmar = language === 'my';
  const jobSkills = extractJobSkills(jobDescription);
  const base = scoreSkillMatch(resumeSkills, jobSkills, language);

  const matched_skills = jobSkills.filter(
    (jobSkill) =>
      !base.missing_skills.some((missing) => skillsMatch(missing, jobSkill))
  );

  const improvements = [];

  if (base.missing_skills.length > 0) {
    improvements.push(
      isMyanmar
        ? `CV တွင် အောက်ပါ ကျွမ်းကျင်မှုများကို ထည့်သွင်း သို့မဟုတ် ထင်ရှားအောင် ဖော်ပြပါ — ${base.missing_skills.slice(0, 4).join(', ')}။`
        : `Add or emphasize these skills on your resume: ${base.missing_skills.slice(0, 4).join(', ')}.`
    );
  }

  if (parsedExperience?.summary) {
    improvements.push(
      isMyanmar
        ? 'အလုပ်ဖော်ပြချက်ရှိ အဓိကလိုအပ်ချက်များနှင့် ကိုက်ညီအောင် ကိုယ်ရေးအကျဉ်းကို ပြန်လည်ရေးသားပါ။'
        : 'Rewrite your summary to mirror the top requirements in the job description.'
    );
  }

  improvements.push(
    isMyanmar
      ? 'အလုပ်ကြော်ငြာရှိ အဓိကစကားလုံးများကို အတွေ့အကြုံအပိုင်းတွင် အသုံးပြုပါ။'
      : 'Use the same keywords from the job posting in your experience bullets.'
  );
  improvements.push(
    isMyanmar
      ? 'ရလဒ်ကို အလေးပေးသော အလုပ်များတွင် ကိန်းဂဏန်းနှင့် အောင်မြင်မှုများကို ဖော်ပြပါ။'
      : 'Quantify achievements (metrics, impact) where the role values results.'
  );

  if (jobTitle?.trim()) {
    improvements.push(
      isMyanmar
        ? `ခေါင်းစဉ် သို့မဟုတ် ရည်မှန်းချက်ကို "${jobTitle.trim()}" နှင့် ကိုက်ညီအောင် ပြင်ဆင်ပါ။`
        : `Tailor your headline or objective toward: ${jobTitle.trim()}.`
    );
  }

  return {
    match_score: base.match_score,
    matched_skills,
    missing_skills: base.missing_skills,
    improvements: improvements.slice(0, 5),
    feedback: base.feedback,
  };
}

module.exports = { parseResumeText, extractJobSkills, scoreSkillMatch, analyzeResumeMatch };
