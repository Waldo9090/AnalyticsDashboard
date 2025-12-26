# Why Email Bounces Occur (Even with Recently Scraped Emails)

## 📊 Your PRUSA Florida Campaign Bounce Stats
- **Total Emails Sent:** 1,412
- **Bounces:** 15
- **Bounce Rate:** 1.06% ✅ (This is actually EXCELLENT - industry standard is <2%)

---

## 🔍 Understanding Email Bounces

### Two Types of Bounces:

#### 1. **Hard Bounces** (Permanent Failures)
These are **permanent** and indicate the email address will never be deliverable:
- ❌ **Invalid Email Address** - Email doesn't exist (e.g., `john@nonexistentdomain.com`)
- ❌ **Domain Doesn't Exist** - The domain name is invalid or expired
- ❌ **Mailbox Full** - Recipient's inbox is permanently full (rare)
- ❌ **Blocked by Recipient** - Email address explicitly blocked your domain
- ❌ **Role-Based Addresses** - Some addresses like `info@`, `sales@` may reject cold emails

#### 2. **Soft Bounces** (Temporary Failures)
These are **temporary** and might resolve later:
- ⚠️ **Mailbox Full** - Temporary storage limit reached
- ⚠️ **Server Overloaded** - Recipient's mail server is temporarily down
- ⚠️ **Message Too Large** - Email exceeds size limits
- ⚠️ **Rate Limiting** - Too many emails sent to the domain too quickly

---

## 🤔 Why Bounces Happen Even with "Recently Scraped" Emails

### 1. **Email Validation ≠ Email Deliverability**
Just because an email was scraped recently doesn't mean:
- ✅ The email address is **valid** (syntax correct)
- ✅ The email address is **active** (person still uses it)
- ✅ The email address **accepts cold emails** (not blocked)

### 2. **Common Scraping Issues**

#### **Outdated Data Sources**
- Email was valid when scraped, but person left company
- Email was valid when scraped, but domain changed
- Email was valid when scraped, but account was deactivated

#### **Incorrect Email Formats**
- Scraping tools sometimes guess emails: `firstname.lastname@company.com`
- These guesses can be wrong even if the pattern seems correct
- Example: Real email might be `john.smith@company.com` but scraper guessed `j.smith@company.com`

#### **Role-Based Addresses**
- `info@company.com`, `sales@company.com`, `contact@company.com`
- These often bounce because:
  - They're monitored by automated systems
  - They reject unsolicited emails
  - They may not have a real person checking them

#### **Disposable/Temporary Emails**
- Some people use temporary email addresses
- These expire quickly even if scraped recently
- Services like `10minutemail.com`, `tempmail.com` etc.

### 3. **Email Server Rejections**

#### **SPF/DKIM/DMARC Failures**
- Even valid emails can bounce if your sending domain isn't properly configured
- Recipient servers check authentication before accepting emails

#### **Reputation Issues**
- If your sending domain/IP has poor reputation, more emails bounce
- This is why Instantly.ai uses multiple sending domains/IPs

#### **Rate Limiting**
- Sending too many emails to one domain too quickly
- Recipient servers temporarily reject to prevent spam

### 4. **Data Quality Issues**

#### **Typographical Errors**
- Scraped emails may have typos: `john@gmial.com` instead of `john@gmail.com`
- OCR errors if scraping from images/PDFs
- Manual entry errors in source data

#### **Format Variations**
- `john.smith@company.com` vs `johnsmith@company.com` vs `j.smith@company.com`
- Scraper might pick the wrong format

---

## 📈 Industry Standards for Bounce Rates

| Bounce Rate | Rating | Action Needed |
|-------------|--------|---------------|
| **< 2%** | ✅ Excellent | None - Keep doing what you're doing |
| **2-5%** | ⚠️ Good | Monitor and improve data quality |
| **5-10%** | ⚠️ Warning | Review data sources and validation |
| **> 10%** | ❌ Critical | Stop campaign, fix data sources immediately |

**Your 1.06% bounce rate is EXCELLENT!** 🎉

---

## 🛡️ How Instantly.ai Handles Bounces

### **Automatic Bounce Protection**
1. **Hard Bounces** → Lead is automatically removed from campaign
2. **Soft Bounces** → Retry mechanism (usually 3 attempts)
3. **Bounce Threshold** → If bounce rate exceeds limits, campaign pauses automatically

### **Campaign Status Codes**
- `BOUNCE_PROTECT: -2` - Campaign paused due to high bounce rate
- This protects your sender reputation

---

## 💡 Best Practices to Reduce Bounces

### 1. **Email Validation**
- Use services like ZeroBounce, NeverBounce, or Hunter.io
- Validate emails **before** adding to campaigns
- Check syntax, domain validity, and mailbox existence

### 2. **Data Source Quality**
- Prefer direct sources (LinkedIn, company websites)
- Avoid third-party lists (often outdated)
- Verify emails are current (check LinkedIn activity)

### 3. **Warm-Up Your Domains**
- Gradually increase sending volume
- Start with small batches
- Build sender reputation over time

### 4. **Monitor Bounce Rates**
- Keep bounce rate below 2%
- Review bounced emails regularly
- Remove invalid addresses from future campaigns

### 5. **Use Multiple Sending Domains**
- Distribute load across domains
- Protect main domain reputation
- Instantly.ai does this automatically

---

## 🎯 Why Your 1.06% Bounce Rate is Great

For the PRUSA Florida Campaign:
- **15 bounces out of 1,412 emails = 1.06%**

This indicates:
- ✅ **High-quality data sources** - Your scraping/lead generation is accurate
- ✅ **Good email validation** - Most emails are valid and deliverable
- ✅ **Proper domain setup** - SPF/DKIM/DMARC configured correctly
- ✅ **Healthy sender reputation** - Email providers trust your sending

---

## 🔬 Common Bounce Reasons Breakdown

Based on typical cold email campaigns, here's what those 15 bounces likely are:

1. **Invalid Email Format (40-50%)** - Typos, wrong format guesses
2. **Domain Issues (20-30%)** - Domain expired, doesn't exist
3. **Mailbox Full/Inactive (10-20%)** - Account abandoned, not checked
4. **Role-Based Rejections (10-15%)** - `info@`, `sales@` addresses
5. **Server Rejections (5-10%)** - Rate limiting, temporary issues

---

## 📝 Summary

**Bounces happen even with recently scraped emails because:**

1. ✅ **Recently scraped ≠ Valid email** - Syntax correct doesn't mean deliverable
2. ✅ **Recently scraped ≠ Active email** - Person may have left company
3. ✅ **Recently scraped ≠ Accepts cold emails** - Some addresses reject unsolicited mail
4. ✅ **Data quality issues** - Typos, format guesses, outdated sources
5. ✅ **Server-side rejections** - Rate limiting, reputation, authentication

**Your 1.06% bounce rate is excellent** - it shows your data quality and email setup are working well! 🎉


