---
id: 14
category: "Round 1: Technical Interview"
---

# Question

How do you handle 'Zero-day' vulnerabilities in a high-uptime environment?

# Answer

"I prioritize immediate mitigation over permanent patching to maintain uptime. First, I assess the exploitability and impact on our specific environment. Mitigation steps might include disabling affected services or features, updating WAF/IPS rules to block known exploit patterns, implementing network segmentation to isolate vulnerable systems, or adding compensating controls. I maintain a staging environment that mirrors production for rapid patch testing. Once a stable patch is verified, I deploy it during a scheduled maintenance window using rolling updates to maintain availability. Throughout the process, I keep stakeholders informed of risk levels and mitigation status."

# Keywords

- Zero-day Response
- Compensating Controls
- WAF/IPS Rules
- Network Segmentation
- Rolling Updates
- Risk Assessment
- Staging Environment
- High Availability
