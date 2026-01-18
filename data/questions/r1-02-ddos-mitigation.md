---
id: 12
category: "Round 1: Technical Interview"
---

# Question

Explain how you would mitigate a massive DDoS attack on our server farm.

# Answer

"I would use a multi-layered defense strategy. First, implementing rate limiting at the edge to throttle suspicious traffic. Second, utilizing Anycast DNS to distribute traffic across multiple geographic locations, preventing any single point from being overwhelmed. Third, deploying a scrubbing service (like Cloudflare or Akamai) to filter malicious packets before they reach our internal network. Additionally, I maintain pre-configured runbooks with ISP contacts for upstream filtering and have auto-scaling policies to absorb legitimate traffic spikes. Real-time monitoring with automatic alerting ensures rapid response to volumetric attacks."

# Keywords

- DDoS Mitigation
- Rate Limiting
- Anycast DNS
- Traffic Scrubbing
- Multi-layered Defense
- Auto-scaling
- Upstream Filtering
- Volumetric Attack
