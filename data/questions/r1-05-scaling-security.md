---
id: 15
category: "Round 1: Technical Interview"
---

# Question

Describe the difference between 'Horizontal' and 'Vertical' scaling in terms of security risk.

# Answer

"Horizontal scaling increases the attack surface because there are more nodes to manage and secure - each instance needs patching, monitoring, and access control. However, it provides resilience against single points of failure. Vertical scaling concentrates risk on a single powerful machine - if compromised, the impact is total, but there's only one system to secure. I prefer horizontal scaling with automated, standardized security templates using Infrastructure as Code (Terraform, Ansible). This ensures every new instance is deployed with identical hardening configurations, security agents, and compliance baselines, maintaining a consistent security posture at scale."

# Keywords

- Horizontal Scaling
- Vertical Scaling
- Attack Surface Management
- Infrastructure as Code (IaC)
- Terraform/Ansible
- Security Templates
- Consistent Security Posture
- Single Point of Failure
