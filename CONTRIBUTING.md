# 贡献指南

感谢你改进研究生课程规划器。

## 提交前检查

请确认修改没有包含个人学号、姓名、联系方式或个人选课方案，并运行：

```bash
npm run build
npx oxlint app/page.tsx app/layout.tsx
```

## 课程数据修改

课程数据位于 `public/data/courses.json`。请保留现有字段结构，并在提交说明中写清数据来源、适用学年和可能的时效性。课程考核方式、上课时间和开课状态应优先以官方系统为准。

## Issue 与 Pull Request

- Bug 请描述复现步骤、浏览器和 Node.js 版本。
- 新功能建议请说明使用场景和预期行为。
- Pull Request 请保持改动范围清晰，并在描述中列出已完成的验证。
