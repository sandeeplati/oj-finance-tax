/**
 * OJ Gnan Tax Chatbot Engine
 * Rule-based chatbot with comprehensive Indian tax knowledge base.
 * When Form 16 context is provided, answers are personalized.
 */

// ─── Knowledge Base ───────────────────────────────────────────────────────────

const KB = [
  // ── Form 16 ──
  {
    tags: ['form16', 'form 16', 'what is form 16', 'form16 meaning'],
    answer: `**Form 16** is a TDS (Tax Deducted at Source) certificate issued by your employer under Section 203 of the Income Tax Act.

It has two parts:
• **Part A** – Employer details, employee PAN, TAN, and quarterly TDS deposited
• **Part B** – Detailed salary breakup, deductions claimed, and taxable income

📌 It is issued annually after the financial year ends (usually by June 15). You need it to file your ITR.`,
  },
  {
    tags: ['form 16 password', 'pdf password', 'form16 password', 'password form 16'],
    answer: `Most employer-issued Form 16 PDFs are **password-protected** for security.

🔑 The password is typically your **PAN number in uppercase**, e.g. \`ABCDE1234F\`

Some employers use:
• Date of birth: \`DDMMYYYY\`
• Combination of PAN + DOB

If none work, contact your HR/payroll team for the correct password.`,
  },
  {
    tags: ['form 16 not received', 'employer not giving form 16', 'form 16 missing'],
    answer: `If your employer hasn't issued Form 16:

1. **Request from HR/Payroll** – Employers are legally required to issue it by June 15
2. **Check email** – Many employers send it digitally
3. **Use Form 26AS** – Download from TRACES portal (traces.gov.in) to see TDS details
4. **AIS/TIS** – Annual Information Statement on the Income Tax portal has all income details
5. **File ITR without Form 16** – You can still file using salary slips and Form 26AS

⚠️ Employers who fail to issue Form 16 can be penalized ₹100/day under Section 272A.`,
  },

  // ── ITR Filing ──
  {
    tags: ['itr', 'income tax return', 'how to file itr', 'file itr', 'itr filing'],
    answer: `**How to file ITR (Income Tax Return):**

1. Go to **incometax.gov.in**
2. Login with PAN/Aadhaar
3. Select **File Income Tax Return**
4. Choose Assessment Year (AY 2025-26 for FY 2024-25)
5. Select ITR form:
   - **ITR-1 (Sahaj)** – Salaried, one house property, income ≤ ₹50L
   - **ITR-2** – Capital gains, multiple properties
   - **ITR-3** – Business/profession income
6. Pre-fill data from Form 16 / AIS
7. Verify deductions and submit
8. **e-Verify** within 30 days (Aadhaar OTP / Net Banking)

📅 **Due date**: July 31 (for salaried individuals, no audit)`,
  },
  {
    tags: ['itr due date', 'last date itr', 'deadline itr', 'itr deadline'],
    answer: `**ITR Filing Due Dates (FY 2024-25 / AY 2025-26):**

| Category | Due Date |
|----------|----------|
| Individuals (salaried) | **July 31, 2025** |
| Businesses (audit required) | October 31, 2025 |
| Transfer pricing cases | November 30, 2025 |

⚠️ Late filing penalty:
• Income ≤ ₹5L → ₹1,000
• Income > ₹5L → ₹5,000
• Plus interest u/s 234A (1% per month on tax due)`,
  },
  {
    tags: ['belated return', 'late itr', 'missed deadline itr'],
    answer: `**Belated ITR** can be filed up to **December 31** of the assessment year.

For FY 2024-25: You can file belated return up to **December 31, 2025**.

Consequences of late filing:
• Penalty of ₹1,000–₹5,000 under Section 234F
• Interest u/s 234A on unpaid tax
• Cannot carry forward most losses (except house property loss)
• Cannot switch to old regime (if you missed the deadline)`,
  },

  // ── Tax Regimes ──
  {
    tags: ['old regime', 'new regime', 'which regime', 'tax regime', 'old vs new', 'regime comparison', 'better regime'],
    answer: `**Old Regime vs New Regime (FY 2024-25):**

| Feature | Old Regime | New Regime |
|---------|-----------|-----------|
| Standard Deduction | ₹50,000 | ₹75,000 |
| 80C deductions | ✅ Up to ₹1.5L | ❌ Not allowed |
| HRA exemption | ✅ | ❌ |
| 80D (health insurance) | ✅ | ❌ |
| NPS (80CCD 1B) | ✅ ₹50,000 | ❌ |
| 87A Rebate | Income ≤ ₹5L | Income ≤ ₹7L |

**Choose Old Regime if:** You have high deductions (80C + HRA + 80D + NPS > ₹3.75L)
**Choose New Regime if:** You have fewer deductions or income > ₹15L

💡 Upload your Form 16 and I'll tell you which regime saves you more!`,
  },
  {
    tags: ['new regime slabs', 'new tax slabs', 'tax slabs 2024', 'income tax slabs'],
    answer: `**New Tax Regime Slabs (FY 2024-25):**

| Income Range | Tax Rate |
|-------------|---------|
| Up to ₹3,00,000 | 0% |
| ₹3,00,001 – ₹7,00,000 | 5% |
| ₹7,00,001 – ₹10,00,000 | 10% |
| ₹10,00,001 – ₹12,00,000 | 15% |
| ₹12,00,001 – ₹15,00,000 | 20% |
| Above ₹15,00,000 | 30% |

✅ **Standard Deduction**: ₹75,000
✅ **87A Rebate**: Full tax rebate if income ≤ ₹7,00,000 (effectively zero tax)
➕ **4% Health & Education Cess** on total tax`,
  },
  {
    tags: ['old regime slabs', 'old tax slabs'],
    answer: `**Old Tax Regime Slabs (FY 2024-25):**

| Income Range | Tax Rate |
|-------------|---------|
| Up to ₹2,50,000 | 0% |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

✅ **Standard Deduction**: ₹50,000
✅ **87A Rebate**: Full rebate if income ≤ ₹5,00,000
➕ **4% Health & Education Cess** on total tax

Senior Citizens (60–80): Basic exemption ₹3,00,000
Super Senior Citizens (80+): Basic exemption ₹5,00,000`,
  },

  // ── Deductions ──
  {
    tags: ['80c', 'section 80c', '80c deductions', '80c investments', 'tax saving investments'],
    answer: `**Section 80C — Up to ₹1,50,000 deduction (Old Regime only)**

Popular 80C investments:
| Investment | Lock-in | Returns |
|-----------|---------|---------|
| **ELSS Mutual Funds** | 3 years | Market-linked (~12-15%) |
| **PPF** | 15 years | 7.1% (tax-free) |
| **EPF** | Till retirement | 8.25% |
| **NSC** | 5 years | 7.7% |
| **Tax-saving FD** | 5 years | 6.5-7.5% |
| **LIC Premium** | Policy term | Insurance + savings |
| **Home Loan Principal** | – | Asset creation |
| **Sukanya Samriddhi** | Till daughter's 21 | 8.2% (tax-free) |
| **SCSS** | 5 years | 8.2% (senior citizens) |

💡 ELSS gives the best returns with the shortest lock-in period.`,
  },
  {
    tags: ['80d', 'section 80d', 'health insurance deduction', 'medical insurance tax'],
    answer: `**Section 80D — Health Insurance Premium Deduction (Old Regime)**

| Who | Limit |
|-----|-------|
| Self + Family (below 60) | ₹25,000 |
| Self + Family (60+) | ₹50,000 |
| Parents (below 60) | ₹25,000 additional |
| Parents (60+) | ₹50,000 additional |
| **Maximum total** | **₹1,00,000** |

Also includes:
• Preventive health check-up: ₹5,000 (within above limits)
• Medical expenditure for very senior citizens (80+) without insurance

💡 A family floater policy covering self, spouse, and children typically costs ₹15,000–₹25,000/year.`,
  },
  {
    tags: ['nps', '80ccd', 'national pension', 'nps deduction', 'nps tax benefit'],
    answer: `**NPS (National Pension System) Tax Benefits:**

1. **Section 80CCD(1)** – Up to 10% of salary (within ₹1.5L 80C limit)
2. **Section 80CCD(1B)** – Additional ₹50,000 over and above 80C limit ⭐
3. **Section 80CCD(2)** – Employer's NPS contribution (up to 10% of salary, no limit)

**Total NPS benefit**: Up to ₹2,00,000 (₹1.5L + ₹50K)

At retirement:
• 60% lump sum withdrawal – **Tax-free**
• 40% must be used to buy annuity – Taxable as income

💡 80CCD(1B) is the most valuable deduction — ₹50,000 extra over 80C!`,
  },
  {
    tags: ['hra', 'house rent allowance', 'hra exemption', 'hra calculation', 'rent deduction'],
    answer: `**HRA (House Rent Allowance) Exemption — Old Regime**

HRA exemption = **Minimum of:**
1. Actual HRA received
2. 50% of basic salary (metro cities) / 40% (non-metro)
3. Actual rent paid – 10% of basic salary

**Metro cities**: Mumbai, Delhi, Kolkata, Chennai

**Requirements:**
• Must be paying rent (not living in own house)
• Rent > ₹1,00,000/year → PAN of landlord required
• Keep rent receipts

💡 If you pay rent but don't receive HRA, claim deduction under Section 80GG (up to ₹60,000/year).`,
  },
  {
    tags: ['standard deduction', 'what is standard deduction'],
    answer: `**Standard Deduction** is a flat deduction from salary income — no proof required.

| Regime | Standard Deduction |
|--------|-------------------|
| Old Regime | ₹50,000 |
| New Regime | ₹75,000 |

It was increased to ₹75,000 in the New Regime from FY 2024-25 (Budget 2024).

This deduction is automatically applied — you don't need to claim it separately.`,
  },
  {
    tags: ['80g', 'donation deduction', 'charity tax', 'section 80g'],
    answer: `**Section 80G — Donations to Charitable Organizations**

| Type | Deduction |
|------|-----------|
| PM Relief Fund, National Defence Fund | 100% (no limit) |
| Approved charitable trusts | 50% (with 10% of income limit) |
| Political parties (80GGC) | 100% |

**Conditions:**
• Donation must be in cash ≤ ₹2,000 (above ₹2,000 must be by cheque/online)
• Get a receipt with the organization's 80G registration number
• Only available in Old Regime`,
  },
  {
    tags: ['80e', 'education loan', 'student loan deduction', 'section 80e'],
    answer: `**Section 80E — Education Loan Interest Deduction**

• **No upper limit** on deduction amount
• Available for **8 consecutive years** from the year repayment starts
• Covers: Self, spouse, children, or student for whom you are legal guardian
• Loan must be from a bank/financial institution (not family/friends)
• Only **interest** is deductible (not principal)
• Available in **Old Regime only**`,
  },
  {
    tags: ['home loan', 'housing loan', 'section 24', '24b', 'home loan interest'],
    answer: `**Home Loan Tax Benefits:**

| Section | Benefit | Limit |
|---------|---------|-------|
| **80C** | Principal repayment | ₹1,50,000 (within 80C) |
| **24(b)** | Interest (self-occupied) | ₹2,00,000 |
| **24(b)** | Interest (let-out property) | No limit |
| **80EEA** | Additional interest (first home, stamp duty ≤ ₹45L) | ₹1,50,000 |

**Section 24(b)** is available in **both regimes** for let-out property.
For self-occupied property, ₹2L interest deduction is only in **Old Regime**.`,
  },
  {
    tags: ['80tta', '80ttb', 'savings interest', 'bank interest deduction'],
    answer: `**Interest Income Deductions:**

**Section 80TTA** (below 60 years):
• Savings account interest deduction up to **₹10,000**
• Covers: Savings bank, post office, co-operative bank

**Section 80TTB** (Senior Citizens 60+):
• All interest income deduction up to **₹50,000**
• Covers: Savings + FD + RD interest
• Replaces 80TTA for senior citizens

Both available in **Old Regime only**.`,
  },

  // ── TDS & Refund ──
  {
    tags: ['tds', 'tax deducted at source', 'what is tds', 'tds refund'],
    answer: `**TDS (Tax Deducted at Source)**

Your employer deducts TDS from your salary every month based on estimated annual tax liability.

**How to check TDS:**
• **Form 26AS** – traces.gov.in (shows all TDS deducted)
• **AIS** – incometax.gov.in → Annual Information Statement
• **Form 16** – Issued by employer

**TDS Refund:**
If TDS deducted > actual tax liability → You get a **refund** after filing ITR.
Refunds are processed within 20-45 days of ITR verification.

💡 Track refund status at: incometax.gov.in → Refund Status`,
  },
  {
    tags: ['refund', 'tax refund', 'income tax refund', 'how to get refund', 'refund status'],
    answer: `**Income Tax Refund Process:**

1. File ITR and e-verify it
2. ITR is processed by CPC Bengaluru
3. Refund is credited to your **pre-validated bank account**
4. Timeline: Usually **20-45 days** after verification

**Check refund status:**
• incometax.gov.in → e-File → Income Tax Returns → View Filed Returns
• NSDL: tin.tin.nsdl.com/oltas/refundstatuslogin.html

**Common reasons for refund delay:**
• Bank account not pre-validated
• PAN-Aadhaar not linked
• ITR not verified
• Mismatch in TDS details`,
  },
  {
    tags: ['advance tax', 'self assessment tax', 'tax payment'],
    answer: `**Advance Tax** — Pay tax in installments during the year

Required if tax liability > ₹10,000 after TDS.

| Due Date | Installment |
|----------|------------|
| June 15 | 15% of tax |
| September 15 | 45% of tax |
| December 15 | 75% of tax |
| March 15 | 100% of tax |

**Interest for non-payment:**
• Section 234B: 1% per month if advance tax < 90% of liability
• Section 234C: 1% per month for each installment shortfall

Pay at: incometax.gov.in → e-Pay Tax (Challan 280)`,
  },

  // ── Surcharge & Cess ──
  {
    tags: ['surcharge', 'income tax surcharge'],
    answer: `**Surcharge on Income Tax:**

| Income | Surcharge Rate |
|--------|---------------|
| ₹50L – ₹1Cr | 10% |
| ₹1Cr – ₹2Cr | 15% |
| ₹2Cr – ₹5Cr | 25% |
| Above ₹5Cr | 37% (Old) / 25% (New) |

**Marginal Relief**: Ensures surcharge doesn't exceed the income above the threshold.

**Health & Education Cess**: 4% on (tax + surcharge) — applicable to all taxpayers.`,
  },
  {
    tags: ['87a', 'rebate 87a', 'tax rebate', 'zero tax'],
    answer: `**Section 87A — Tax Rebate**

| Regime | Condition | Rebate |
|--------|-----------|--------|
| Old Regime | Taxable income ≤ ₹5,00,000 | Up to ₹12,500 |
| New Regime | Taxable income ≤ ₹7,00,000 | Up to ₹25,000 |

**Effectively zero tax** if:
• Old Regime: Income ≤ ₹5L (after all deductions)
• New Regime: Income ≤ ₹7L (after ₹75K standard deduction = gross ≤ ₹7.75L)

⚠️ Rebate is NOT available on special rate income (LTCG, STCG, etc.)`,
  },

  // ── Capital Gains ──
  {
    tags: ['capital gains', 'ltcg', 'stcg', 'mutual fund tax', 'stock tax'],
    answer: `**Capital Gains Tax (FY 2024-25):**

**Equity (Stocks/Equity MF):**
| Type | Holding | Tax Rate |
|------|---------|---------|
| STCG | < 1 year | 20% (was 15%, changed Budget 2024) |
| LTCG | > 1 year | 12.5% above ₹1.25L (was 10% above ₹1L) |

**Debt Mutual Funds (post Apr 2023):**
• Taxed as per income slab (no indexation benefit)

**Real Estate:**
| Type | Holding | Tax |
|------|---------|-----|
| STCG | < 2 years | Slab rate |
| LTCG | > 2 years | 12.5% without indexation (Budget 2024 change) |

💡 LTCG on equity up to ₹1.25L/year is **tax-free**.`,
  },

  // ── PAN & Aadhaar ──
  {
    tags: ['pan aadhaar link', 'pan aadhaar linking', 'link pan aadhaar'],
    answer: `**PAN-Aadhaar Linking**

⚠️ **Mandatory** — Unlinked PANs become inoperative.

**How to link:**
1. SMS: \`UIDPAN <12-digit Aadhaar> <10-digit PAN>\` to 567678 or 56161
2. Online: incometax.gov.in → Link Aadhaar
3. Fee: ₹1,000 (if linking after deadline)

**Consequences of inoperative PAN:**
• TDS deducted at higher rate (20%)
• Cannot file ITR
• Refunds will be held
• Cannot open bank accounts or invest

Check status: incometax.gov.in → Link Aadhaar → Check Status`,
  },

  // ── Greetings & General ──
  {
    tags: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'],
    answer: `👋 **Hello! I'm OJ Gnan Tax Assistant.**

I can help you with:
• 📋 Understanding your Form 16
• 💰 Tax saving strategies (80C, 80D, NPS, HRA)
• ⚖️ Old vs New tax regime comparison
• 📊 ITR filing guidance
• 🔄 TDS and refund queries
• 📈 Capital gains tax

What would you like to know about your taxes today?`,
  },
  {
    tags: ['help', 'what can you do', 'what do you know', 'topics'],
    answer: `I can answer questions on these tax topics:

**📋 Form 16**
• What is Form 16, password, Part A/B

**💰 Deductions (Old Regime)**
• Section 80C, 80D, 80E, 80G, HRA, NPS, Home Loan

**⚖️ Tax Regimes**
• Old vs New regime, which is better, tax slabs

**📊 ITR Filing**
• How to file, due dates, belated return

**🔄 TDS & Refund**
• TDS deduction, refund process, advance tax

**📈 Capital Gains**
• LTCG, STCG on stocks, mutual funds, real estate

**🔗 PAN & Aadhaar**
• Linking, consequences

Just ask your question in plain English!`,
  },
  {
    tags: ['thank you', 'thanks', 'thank', 'great', 'helpful'],
    answer: `You're welcome! 😊 

Feel free to ask any more tax questions. Remember:
• Upload your Form 16 for personalized analysis
• Use the **Tax Summary** tab to see your tax breakdown
• Check **Recommendations** for tax-saving tips specific to your income

Happy tax filing! 🎉`,
  },
];

// ─── Context-aware responses (when Form 16 data is available) ─────────────────

function buildContextResponse(question, taxData, comparisonResult) {
  const q = question.toLowerCase();
  const salary = taxData?.salaryDetails || {};
  const deductions = taxData?.deductions || {};
  const taxDetails = taxData?.taxDetails || {};
  const old = comparisonResult?.oldRegime || {};
  const newR = comparisonResult?.newRegime || {};
  const recommended = comparisonResult?.recommended;
  const savings = comparisonResult?.savings || 0;

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  // My tax / how much tax
  if (/my tax|how much tax|tax payable|tax liability|total tax/.test(q)) {
    return `Based on your Form 16:

**${recommended === 'old' ? 'Old' : 'New'} Regime (Recommended):**
• Gross Salary: ${fmt(salary.grossSalary)}
• Taxable Income: ${fmt(recommended === 'old' ? old.taxableIncome : newR.taxableIncome)}
• **Total Tax: ${fmt(recommended === 'old' ? old.totalTax : newR.totalTax)}**
• TDS Paid: ${fmt(taxDetails.tdsPaid)}
• ${old.refund > 0 || newR.refund > 0 ? `**Refund Due: ${fmt(recommended === 'old' ? old.refund : newR.refund)}** 🎉` : `**Tax Due: ${fmt(recommended === 'old' ? old.taxDue : newR.taxDue)}**`}

Switching to ${recommended === 'old' ? 'New' : 'Old'} Regime would cost you ${fmt(savings)} more.`;
  }

  // Refund
  if (/refund|get money back|excess tds/.test(q)) {
    const refund = recommended === 'old' ? old.refund : newR.refund;
    if (refund > 0) {
      return `🎉 **Yes! You are eligible for a refund of ${fmt(refund)}.**

Your TDS paid (${fmt(taxDetails.tdsPaid)}) exceeds your tax liability (${fmt(recommended === 'old' ? old.totalTax : newR.totalTax)}).

**To claim your refund:**
1. File your ITR before July 31, 2025
2. Ensure your bank account is pre-validated on the IT portal
3. Refund will be credited within 20-45 days of ITR verification`;
    } else {
      const due = recommended === 'old' ? old.taxDue : newR.taxDue;
      return `Based on your Form 16, you **do not have a refund**. ${due > 0 ? `You have an additional tax due of ${fmt(due)}.` : 'Your TDS is perfectly matched with your tax liability.'}`;
    }
  }

  // Which regime
  if (/which regime|better regime|old or new|new or old|should i choose/.test(q)) {
    return `Based on your income and deductions:

**✅ ${recommended === 'old' ? 'Old Tax Regime' : 'New Tax Regime'} is recommended for you.**

| | Old Regime | New Regime |
|--|-----------|-----------|
| Tax | ${fmt(old.totalTax)} | ${fmt(newR.totalTax)} |
| Taxable Income | ${fmt(old.taxableIncome)} | ${fmt(newR.taxableIncome)} |
| Deductions | ${fmt(old.totalDeductions)} | ${fmt(newR.totalDeductions)} |

**You save ${fmt(savings)}** by choosing the ${recommended === 'old' ? 'Old' : 'New'} Regime.`;
  }

  // Salary
  if (/my salary|gross salary|basic salary|how much i earn/.test(q)) {
    return `Your salary details from Form 16:

• **Gross Salary**: ${fmt(salary.grossSalary)}
• **Basic Salary**: ${fmt(salary.basicSalary)}
• **HRA**: ${fmt(salary.hra)}
• **Special Allowance**: ${fmt(salary.specialAllowance)}
• **LTA**: ${fmt(salary.lta)}
• **TDS Paid**: ${fmt(taxDetails.tdsPaid)}`;
  }

  // Deductions
  if (/my deductions|deductions claimed|80c amount|how much deduction/.test(q)) {
    return `Your deductions from Form 16:

• **Standard Deduction**: ₹50,000
• **Section 80C**: ${fmt(deductions.section80C)} ${deductions.section80C < 150000 ? `(₹${(150000 - (deductions.section80C || 0)).toLocaleString('en-IN')} more can be invested!)` : '(Maxed out ✅)'}
• **Section 80D**: ${fmt(deductions.section80D)}
• **NPS (80CCD 1B)**: ${fmt(deductions.nps)}
• **HRA Exemption**: ${fmt(deductions.hraExemption)}
• **Professional Tax**: ${fmt(deductions.professionalTax)}`;
  }

  return null; // No context-specific answer found
}

// ─── Main chatbot function ────────────────────────────────────────────────────

function findAnswer(question, taxData, comparisonResult) {
  const q = question.toLowerCase().trim();

  // 1. Try context-aware answer first (if Form 16 data available)
  if (taxData && comparisonResult) {
    const contextAnswer = buildContextResponse(q, taxData, comparisonResult);
    if (contextAnswer) return { answer: contextAnswer, source: 'context' };
  }

  // 2. Search knowledge base
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const tag of entry.tags) {
      if (q.includes(tag)) {
        score += tag.split(' ').length; // longer tag matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return { answer: bestMatch.answer, source: 'kb' };
  }

  // 3. Keyword fallback
  if (/tax|income|salary|deduct|invest|save|itr|return|refund|tds|pan|aadhaar/.test(q)) {
    return {
      answer: `I understand you're asking about taxes. Could you be more specific? Here are some things I can help with:

• **"What is 80C?"** – Tax saving investments
• **"Which regime is better?"** – Old vs New regime
• **"How to file ITR?"** – Filing guide
• **"What is my tax?"** – Personalized (after uploading Form 16)
• **"How to claim HRA?"** – HRA exemption
• **"What is Form 16?"** – TDS certificate explained`,
      source: 'fallback',
    };
  }

  // 4. Default
  return {
    answer: `I'm not sure about that. I specialize in **Indian income tax** topics.

Try asking:
• "What deductions can I claim?"
• "How much tax do I owe?" (after uploading Form 16)
• "Old regime vs new regime"
• "How to file ITR?"
• "What is Section 80C?"`,
    source: 'default',
  };
}

// ─── Suggested questions ──────────────────────────────────────────────────────

function getSuggestedQuestions(hasForm16) {
  if (hasForm16) {
    return [
      'How much tax do I owe?',
      'Am I eligible for a refund?',
      'Which regime is better for me?',
      'What are my deductions?',
      'How can I save more tax?',
    ];
  }
  return [
    'What is Form 16?',
    'Old regime vs new regime?',
    'What is Section 80C?',
    'How to file ITR?',
    'What is HRA exemption?',
  ];
}

module.exports = { findAnswer, getSuggestedQuestions };

// Made with Bob