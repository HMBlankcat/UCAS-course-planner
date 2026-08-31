# 课程数据

`courses.json` 是课程目录数据。网站首次打开不会加载任何默认选课方案；用户加入的课程只保存到浏览器本机。

课程对象至少包含：

```json
{
  "code": "课程代码",
  "name": "课程名称",
  "type": "课程类型",
  "credit": 2,
  "teacher": "教师",
  "exam": "考核方式",
  "place": "地点",
  "campus": "雁栖湖",
  "sessions": []
}
```

一级学科匹配优先根据课程代码第 7—10 位识别一级学科，例如 `1404` 对应“遥感科学与技术”；课程数据中的 `discipline`、共享课程字段 `sharedDiscipline`、`sharedDisciplines`、`eligibleDiscipline`、`degreeDiscipline` 以及 Excel 列名 `所属一级学科`、`共享学科`、`共享学科所属一级学科/专业学位` 也会一并参与匹配。校区使用 `campus` 字段，当前页面支持雁栖湖、玉泉路和中关村筛选。

公开发布或更新数据前，请核对课程信息的准确性和再分发权限。
