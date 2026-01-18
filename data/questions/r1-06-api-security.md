---
id: 16
category: "Round 1: Technical Interview"
---

# Question

How do you secure API communication between internal servers?

# Answer

"I enforce mTLS (Mutual TLS) to ensure both parties are authenticated and all data is encrypted in transit - this prevents man-in-the-middle attacks even within the internal network. I implement API gateways for centralized authentication, rate limiting, and logging. Access is controlled using 'Least Privilege' scoped tokens with short expiration times, typically using OAuth 2.0 or service mesh patterns like Istio. I also implement API versioning and input validation to prevent injection attacks, and maintain an API inventory to prevent shadow APIs from creating security gaps."

# Keywords

- mTLS (Mutual TLS)
- API Gateway
- Least Privilege
- OAuth 2.0
- Service Mesh (Istio)
- Zero Trust Network
- Input Validation
- API Inventory
