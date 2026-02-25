# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - paragraph [ref=e5]: Research Logs
        - heading "KIWI BIT Blog" [level=1] [ref=e6]
        - paragraph [ref=e7]: Draft to publish workflow, technical analysis, and practical security playbooks.
      - generic [ref=e8]:
        - textbox "Search posts, tags or categories..." [ref=e9]
        - button "Search" [ref=e10] [cursor=pointer]
      - generic [ref=e11]:
        - link "Previous" [ref=e12] [cursor=pointer]:
          - /url: /blog?page=1
        - generic [ref=e13]: Page 1 / 1
        - link "Next" [ref=e14] [cursor=pointer]:
          - /url: /blog?page=1
      - generic [ref=e16]:
        - heading "Newsletter" [level=3] [ref=e17]
        - paragraph [ref=e18]: Get new intelligence posts with double opt-in confirmation.
        - generic [ref=e19]:
          - textbox "you@company.com" [ref=e20]
          - button "Subscribe" [ref=e21] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```