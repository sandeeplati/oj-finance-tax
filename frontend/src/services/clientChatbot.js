/**
 * Client-side chatbot for GitHub Pages / offline mode.
 * Mirrors the backend chatbot knowledge base.
 */

const KB = [
  {
    tags: ['form16', 'form 16', 'what is form 16', 'form16 meaning'],
    answer: `**Form 16** is a TDS certificate issued by your employer under Section 203 of the Income Tax Act.\n\nIt has two parts:\n• **Part A** – Employer details, employee PAN, TAN, and quarterly TDS deposited\n• **Part B** – Detailed salary breakup, deductions claimed, and taxable income\n\n📌 Issued annually after the financial year ends (usually by June 15). Required to file your ITR.`,
  },
  {
    tags: ['form 16 password', 'pdf password', 'form16 password', 'password form 16'],
    answer: `Most employer-issued Form 16 PDFs are **password-protected**.\n\n🔑 The password is typically your **PAN number in uppercase**, e.g. \`ABCDE1234F\`\n\nSome employers use:\n• Date of birth: \`DDMMYYYY\`\n• Combination of PAN + DOB\n\nIf none work, contact your HR/payroll team.`,
  },
  {
    tags: ['itr', 'income tax return', 'how to file itr', 'file itr', 'itr filing'],
    answer: `**How to file ITR:**\n\n1. Go to **incometax.gov.in**\n2. Login with PAN/Aadhaar\n3. Select **File Income Tax Return**\n4. Choose AY 2025-26 (for FY 2024-25)\n5. Select ITR form (ITR-1 for salaried ≤ ₹50L)\n6. Pre-fill from Form 16 / AIS\n7. Verify deductions and submit\n8. **e-Verify** within 30 days\n\n📅 **Due date**: July 31, 2025`,
  },
  {
    tags: ['itr due date', 'last date itr', 'deadline itr', 'itr deadline'],
    answer: `**ITR Filing Due Dates (FY 2024-25 / AY 2025-26):**\n\n| Category | Due Date |\n|----------|----------|\n| Individuals (salaried) | **July 31, 2025** |\n| Businesses (audit) | October 31, 2025 |\n\n⚠️ Late filing penalty: ₹1,000 (income ≤ ₹5L) or ₹5,000 (income > ₹5L)`,
  },
  {
    tags: ['old regime', 'new regime', 'which regime', 'tax regime', 'old vs new', 'regime comparison', 'better regime'],
    answer: `**Old Regime vs New Regime (FY 2024-25):**\n\n| Feature | Old Regime | New Regime |\n|---------|-----------|----------|\n| Standard Deduction | ₹50,000 | ₹75,000 |\n| 80C deductions | ✅ Up to ₹1.5L | ❌ |\n| HRA exemption | ✅ | ❌ |\n| 80D (health insurance) | ✅ | ❌ |\n| 87A Rebate | Income ≤ ₹5L | Income ≤ ₹7L |\n\n**Choose Old Regime if:** High deductions (80C + HRA + 80D + NPS > ₹3.75L)\n**Choose New Regime if:** Fewer deductions or income > ₹15L`,
  },
  {
    tags: ['new regime slabs', 'new tax slabs', 'tax slabs 2024', 'income tax slabs'],
    answer: `**New Tax Regime Slabs (FY 2024-25):**\n\n| Income Range | Tax Rate |\n|-------------|----------|\n| Up to ₹3,00,000 | 0% |\n| ₹3L – ₹7L | 5% |\n| ₹7L – ₹10L | 10% |\n| ₹10L – ₹12L | 15% |\n| ₹12L – ₹15L | 20% |\n| Above ₹15L | 30% |\n\n✅ Standard Deduction: ₹75,000\n✅ 87A Rebate: Zero tax if income ≤ ₹7L`,
  },
  {
    tags: ['old regime slabs', 'old tax slabs'],
    answer: `**Old Tax Regime Slabs (FY 2024-25):**\n\n| Income Range | Tax Rate |\n|-------------|----------|\n| Up to ₹2,50,000 | 0% |\n| ₹2.5L – ₹5L | 5% |\n| ₹5L – ₹10L | 20% |\n| Above ₹10L | 30% |\n\n✅ Standard Deduction: ₹50,000\n✅ 87A Rebate: Zero tax if income ≤ ₹5L`,
  },
  {
    tags: ['80c', 'section 80c', '80c deductions', '80c investments', 'tax saving investments'],
    answer: `**Section 80C — Up to ₹1,50,000 deduction (Old Regime)**\n\n• **ELSS Mutual Funds** – 3 year lock-in, best returns\n• **PPF** – 15 years, 7.1% tax-free\n• **EPF** – 8.25%\n• **NSC** – 5 years, 7.7%\n• **Tax-saving FD** – 5 years\n• **LIC Premium**\n• **Home Loan Principal**\n• **Sukanya Samriddhi** – 8.2% tax-free\n\n💡 ELSS gives best returns with shortest lock-in.`,
  },
  {
    tags: ['80d', 'section 80d', 'health insurance deduction', 'medical insurance tax'],
    answer: `**Section 80D — Health Insurance (Old Regime)**\n\n| Who | Limit |\n|-----|-------|\n| Self + Family (below 60) | ₹25,000 |\n| Self + Family (60+) | ₹50,000 |\n| Parents (below 60) | ₹25,000 extra |\n| Parents (60+) | ₹50,000 extra |\n| **Maximum** | **₹1,00,000** |\n\nAlso includes preventive health check-up: ₹5,000`,
  },
  {
    tags: ['nps', '80ccd', 'national pension', 'nps deduction', 'nps tax benefit'],
    answer: `**NPS Tax Benefits:**\n\n1. **80CCD(1)** – Up to 10% of salary (within ₹1.5L 80C limit)\n2. **80CCD(1B)** – Additional ₹50,000 over 80C ⭐\n3. **80CCD(2)** – Employer's NPS contribution (no limit)\n\n**Total NPS benefit**: Up to ₹2,00,000\n\nAt retirement: 60% lump sum tax-free, 40% annuity taxable`,
  },
  {
    tags: ['hra', 'house rent allowance', 'hra exemption', 'hra calculation', 'rent deduction'],
    answer: `**HRA Exemption (Old Regime)**\n\nHRA exemption = Minimum of:\n1. Actual HRA received\n2. 50% of basic (metro) / 40% (non-metro)\n3. Actual rent – 10% of basic\n\n**Metro cities**: Mumbai, Delhi, Kolkata, Chennai\n\nRent > ₹1L/year → PAN of landlord required`,
  },
  {
    tags: ['standard deduction', 'what is standard deduction'],
    answer: `**Standard Deduction** — flat deduction, no proof needed:\n\n| Regime | Amount |\n|--------|--------|\n| Old Regime | ₹50,000 |\n| New Regime | ₹75,000 |\n\nAutomatically applied — no separate claim needed.`,
  },
  {
    tags: ['tds', 'tax deducted at source', 'what is tds', 'tds refund'],
    answer: `**TDS (Tax Deducted at Source)**\n\nYour employer deducts TDS monthly based on estimated annual tax.\n\n**Check TDS:**\n• Form 26AS – traces.gov.in\n• AIS – incometax.gov.in\n• Form 16 – from employer\n\n**TDS Refund:** If TDS > actual tax → file ITR to claim refund (20-45 days processing)`,
  },
  {
    tags: ['refund', 'tax refund', 'income tax refund', 'how to get refund'],
    answer: `**Income Tax Refund:**\n\n1. File ITR and e-verify\n2. Processed by CPC Bengaluru\n3. Credited to pre-validated bank account\n4. Timeline: **20-45 days** after verification\n\n**Check status:** incometax.gov.in → View Filed Returns\n\nCommon delays: Bank not pre-validated, PAN-Aadhaar not linked, ITR not verified`,
  },
  {
    tags: ['87a', 'rebate 87a', 'tax rebate', 'zero tax'],
    answer: `**Section 87A — Tax Rebate**\n\n| Regime | Condition | Rebate |\n|--------|-----------|--------|\n| Old | Income ≤ ₹5,00,000 | Up to ₹12,500 |\n| New | Income ≤ ₹7,00,000 | Up to ₹25,000 |\n\n**Zero tax effectively:**\n• Old: Gross ≤ ₹5.5L (after ₹50K std deduction)\n• New: Gross ≤ ₹7.75L (after ₹75K std deduction)`,
  },
  {
    tags: ['capital gains', 'ltcg', 'stcg', 'mutual fund tax', 'stock tax'],
    answer: `**Capital Gains Tax (FY 2024-25):**\n\n**Equity:**\n• STCG (< 1 year): **20%**\n• LTCG (> 1 year): **12.5%** above ₹1.25L\n\n**Debt MF (post Apr 2023):** Taxed at slab rate\n\n**Real Estate:**\n• STCG (< 2 years): Slab rate\n• LTCG (> 2 years): **12.5%** without indexation\n\n💡 LTCG on equity up to ₹1.25L/year is tax-free`,
  },
  {
    tags: ['pan aadhaar link', 'pan aadhaar linking', 'link pan aadhaar'],
    answer: `**PAN-Aadhaar Linking — Mandatory**\n\n**How to link:**\n• SMS: \`UIDPAN <Aadhaar> <PAN>\` to 567678\n• Online: incometax.gov.in → Link Aadhaar\n• Fee: ₹1,000\n\n**Consequences of inoperative PAN:**\n• TDS at 20%\n• Cannot file ITR\n• Refunds held`,
  },
  {
    tags: ['advance tax', 'self assessment tax'],
    answer: `**Advance Tax** — Required if tax liability > ₹10,000\n\n| Due Date | Installment |\n|----------|-------------|\n| June 15 | 15% |\n| September 15 | 45% |\n| December 15 | 75% |\n| March 15 | 100% |\n\nPay at: incometax.gov.in → e-Pay Tax (Challan 280)`,
  },
  {
    tags: ['hello', 'hi', 'hey', 'namaste'],
    answer: `👋 **Hello! I'm OJ Gnan Tax Assistant.**\n\nI can help you with:\n• 📋 Form 16 questions\n• 💰 Tax saving (80C, 80D, NPS, HRA)\n• ⚖️ Old vs New regime\n• 📊 ITR filing\n• 🔄 TDS and refunds\n\nWhat would you like to know?`,
  },
  {
    tags: ['help', 'what can you do', 'topics'],
    answer: `I can answer questions on:\n\n**📋 Form 16** – What it is, password, Part A/B\n**💰 Deductions** – 80C, 80D, HRA, NPS, Home Loan\n**⚖️ Tax Regimes** – Old vs New, slabs\n**📊 ITR Filing** – How to file, due dates\n**🔄 TDS & Refund** – Process, timeline\n**📈 Capital Gains** – Stocks, MF, real estate\n\nJust ask in plain English!`,
  },
  {
    tags: ['thank you', 'thanks', 'thank'],
    answer: `You're welcome! 😊 Feel free to ask any more tax questions. Happy tax filing! 🎉`,
  },
];

function buildContextResponse(q, taxData, comparisonResult) {
  const salary = taxData?.salaryDetails || {};
  const deductions = taxData?.deductions || {};
  const taxDetails = taxData?.taxDetails || {};
  const old = comparisonResult?.oldRegime || {};
  const newR = comparisonResult?.newRegime || {};
  const recommended = comparisonResult?.recommended;
  const savings = comparisonResult?.savings || 0;
  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  if (/my tax|how much tax|tax payable|tax liability|total tax/.test(q)) {
    const regime = recommended === 'old' ? old : newR;
    return `Based on your Form 16:\n\n**${recommended === 'old' ? 'Old' : 'New'} Regime (Recommended):**\n• Gross Salary: ${fmt(salary.grossSalary)}\n• Taxable Income: ${fmt(regime.taxableIncome)}\n• **Total Tax: ${fmt(regime.totalTax)}**\n• TDS Paid: ${fmt(taxDetails.tdsPaid)}\n• ${regime.refund > 0 ? `**Refund Due: ${fmt(regime.refund)}** 🎉` : `**Tax Due: ${fmt(regime.taxDue)}**`}`;
  }
  if (/refund|get money back|excess tds/.test(q)) {
    const regime = recommended === 'old' ? old : newR;
    if (regime.refund > 0) {
      return `🎉 **Yes! You are eligible for a refund of ${fmt(regime.refund)}.**\n\nYour TDS paid (${fmt(taxDetails.tdsPaid)}) exceeds your tax liability (${fmt(regime.totalTax)}).\n\nFile your ITR before July 31, 2025 to claim it.`;
    }
    return `Based on your Form 16, you **do not have a refund**. ${regime.taxDue > 0 ? `Additional tax due: ${fmt(regime.taxDue)}.` : 'Your TDS matches your tax liability.'}`;
  }
  if (/which regime|better regime|old or new|new or old|should i choose/.test(q)) {
    return `Based on your income:\n\n**✅ ${recommended === 'old' ? 'Old Tax Regime' : 'New Tax Regime'} is recommended.**\n\n| | Old Regime | New Regime |\n|--|-----------|----------|\n| Tax | ${fmt(old.totalTax)} | ${fmt(newR.totalTax)} |\n| Taxable Income | ${fmt(old.taxableIncome)} | ${fmt(newR.taxableIncome)} |\n\n**You save ${fmt(savings)}** with the ${recommended === 'old' ? 'Old' : 'New'} Regime.`;
  }
  if (/my salary|gross salary|basic salary/.test(q)) {
    return `Your salary from Form 16:\n\n• **Gross Salary**: ${fmt(salary.grossSalary)}\n• **Basic Salary**: ${fmt(salary.basicSalary)}\n• **HRA**: ${fmt(salary.hra)}\n• **Special Allowance**: ${fmt(salary.specialAllowance)}\n• **TDS Paid**: ${fmt(taxDetails.tdsPaid)}`;
  }
  if (/my deductions|deductions claimed|80c amount/.test(q)) {
    return `Your deductions from Form 16:\n\n• **Standard Deduction**: ₹50,000\n• **Section 80C**: ${fmt(deductions.section80C)} ${(deductions.section80C || 0) < 150000 ? `(₹${(150000 - (deductions.section80C || 0)).toLocaleString('en-IN')} more possible!)` : '✅'}\n• **Section 80D**: ${fmt(deductions.section80D)}\n• **NPS**: ${fmt(deductions.nps)}\n• **HRA Exemption**: ${fmt(deductions.hraExemption)}`;
  }
  return null;
}

export function clientChatbot(question, taxData, comparisonResult) {
  const q = (question || '').toLowerCase().trim();

  if (taxData && comparisonResult) {
    const ctx = buildContextResponse(q, taxData, comparisonResult);
    if (ctx) {
      return {
        success: true,
        data: {
          answer: ctx,
          source: 'context',
          suggestions: getSuggestions(true),
        },
      };
    }
  }

  let bestMatch = null;
  let bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const tag of entry.tags) {
      if (q.includes(tag)) score += tag.split(' ').length;
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }

  if (bestMatch && bestScore > 0) {
    return {
      success: true,
      data: {
        answer: bestMatch.answer,
        source: 'kb',
        suggestions: getSuggestions(!!(taxData && comparisonResult)),
      },
    };
  }

  if (/tax|income|salary|deduct|invest|save|itr|return|refund|tds|pan|aadhaar/.test(q)) {
    return {
      success: true,
      data: {
        answer: `I understand you're asking about taxes. Try:\n• "What is 80C?"\n• "Which regime is better?"\n• "How to file ITR?"\n• "What is my tax?" (after uploading Form 16)`,
        source: 'fallback',
        suggestions: getSuggestions(!!(taxData && comparisonResult)),
      },
    };
  }

  return {
    success: true,
    data: {
      answer: `I specialize in **Indian income tax** topics. Try asking:\n• "What deductions can I claim?"\n• "Old regime vs new regime"\n• "How to file ITR?"\n• "What is Section 80C?"`,
      source: 'default',
      suggestions: getSuggestions(!!(taxData && comparisonResult)),
    },
  };
}

function getSuggestions(hasForm16) {
  if (hasForm16) {
    return ['How much tax do I owe?', 'Am I eligible for a refund?', 'Which regime is better for me?', 'What are my deductions?', 'How can I save more tax?'];
  }
  return ['What is Form 16?', 'Old regime vs new regime?', 'What is Section 80C?', 'How to file ITR?', 'What is HRA exemption?'];
}

// Made with Bob