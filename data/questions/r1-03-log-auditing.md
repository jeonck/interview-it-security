---
id: 13
category: "Round 1: Technical Interview"
---

# Question

What is your process for auditing server access logs?

# Answer

"I automate log ingestion into a SIEM platform like Splunk, ELK Stack, or Microsoft Sentinel. I configure real-time alerts for anomalous patterns such as multiple failed logins followed by a success (potential brute force), access from unauthorized IP ranges or geographic locations, and unusual privilege escalation events. I conduct weekly manual reviews of high-privilege account activities and maintain a baseline of normal behavior to detect deviations. Log retention policies are aligned with compliance requirements (typically 1-7 years depending on regulation), and I ensure logs are stored in immutable, tamper-evident storage."

# Keywords

- SIEM (Splunk, ELK, Sentinel)
- Log Analysis
- Anomaly Detection
- Brute Force Detection
- Privilege Escalation Monitoring
- Compliance (SOX, HIPAA)
- Immutable Logging
- Baseline Behavior
