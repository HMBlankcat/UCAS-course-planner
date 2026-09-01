'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Layers3,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type RawSession = {
  weeks?: string;
  dayPeriods?: string;
  day?: string;
  periods?: string;
  room?: string;
};

type Course = {
  code: string;
  name: string;
  type: string;
  property?: string;
  discipline?: string;
  sharedDiscipline?: string;
  sharedDisciplines?: string;
  eligibleDiscipline?: string;
  degreeDiscipline?: string;
  sharedProperty?: string;
  sharedProperties?: string;
  sharedTypes?: string;
  sharedCourseProperty?: string;
  共享课程属性?: string;
  共享课程类型?: string;
  sharedLevel?: string;
  sharedLevels?: string;
  sharedCourseLevel?: string;
  共享课程层次?: string;
  共享课程培养层次?: string;
  所属一级学科?: string;
  共享学科?: string;
  '共享学科所属一级学科/专业学位'?: string;
  '共享学科所属一级学科／专业学位'?: string;
  level?: string;
  credit: number;
  teacher: string;
  teachers?: string;
  exam: string;
  examMode?: string;
  place: string;
  campus?: string;
  sessions: RawSession[];
  rationale?: string;
  degreeRole?: string;
  xhsStatus?: string;
  officialSource?: string;
  capacity?: number;
};

type EnglishMode = '未选择' | '免修' | '线下课' | 'MOOC';
type EnglishPlan = { doctoral: EnglishMode; masters: EnglishMode };
type StudentType =
  | '未选择'
  | '硕士研究生'
  | '直博研究生'
  | '普通招考博士研究生';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIODS = [
  ['1', '08:30–09:15'],
  ['2', '09:20–10:05'],
  ['3', '10:25–11:10'],
  ['4', '11:15–12:00'],
  ['5', '13:30–14:15'],
  ['6', '14:20–15:05'],
  ['7', '15:25–16:10'],
  ['8', '16:15–17:00'],
  ['9', '17:05–17:50'],
  ['10', '18:30–19:15'],
  ['11', '19:20–20:05'],
  ['12', '20:15–21:00'],
  ['13', '21:05–21:50'],
];
const COURSE_TYPES = [
  '全部',
  '学科核心课',
  '专业核心课',
  '专业课',
  '公共必修课',
  '公共选修课',
  '研讨课',
  '实践课',
  '实验课',
];
const PLAN_STORAGE_KEY = 'ucas-graduate-course-planner-v3';
const PAGE_SIZE = 80;
const STUDENT_TYPES: StudentType[] = [
  '硕士研究生',
  '直博研究生',
  '普通招考博士研究生',
];
const CAMPUSES = ['全部校区', '雁栖湖', '玉泉路', '中关村'];
const CAMPUS_BY_CODE_LETTER: Record<string, string> = {
  H: '雁栖湖',
  Y: '玉泉路',
  Z: '中关村',
};
const PRIMARY_DISCIPLINE_BY_CODE: Record<string, string> = {
  '0101': '哲学',
  '0202': '应用经济学',
  '0251': '金融',
  '0252': '应用统计',
  '0270': '统计学',
  '0301': '法学',
  '0305': '马克思主义理论',
  '0354': '知识产权',
  '0402': '心理学',
  '0403': '体育学',
  '0454': '应用心理',
  '0501': '中国语言文学',
  '0502': '外国语言文学',
  '0503': '传播学',
  '0551': '翻译',
  '0601': '考古学',
  '0701': '数学',
  '0702': '物理学',
  '0703': '化学',
  '0704': '天文学',
  '0705': '地理学',
  '0706': '大气科学',
  '0708': '地球物理学',
  '0709': '地质学',
  '0710': '生物学',
  '0711': '系统科学',
  '0712': '科学技术史',
  '0713': '生态学',
  '0714': '统计学',
  '0801': '力学',
  '0803': '光学工程',
  '0804': '仪器科学与技术',
  '0805': '材料科学与工程',
  '0807': '动力工程及工程热物理',
  '0808': '电气工程',
  '0809': '电子科学与技术',
  '0810': '信息与通信工程',
  '0811': '控制科学与工程',
  '0812': '计算机科学与技术',
  '0813': '建筑学',
  '0816': '测绘科学与技术',
  '0817': '化学工程与技术',
  '0818': '地质资源与地质工程',
  '0825': '航空宇航科学与技术',
  '0827': '核科学与技术',
  '0830': '环境科学与工程',
  '0831': '生物医学工程',
  '0835': '软件工程',
  '0839': '网络空间安全',
  '0854': '电子信息',
  '0856': '材料与化工',
  '0857': '资源与环境',
  '0858': '能源动力',
  '0860': '生物与医药',
  '0901': '作物学',
  '0902': '园艺学',
  '0903': '农业资源与环境',
  '0905': '畜牧学',
  '0907': '林学',
  '0908': '水产',
  '0951': '农业',
  '1001': '基础医学',
  '1007': '药学',
  '1008': '中药学',
  '1055': '药学',
  '1201': '管理科学与工程',
  '1202': '工商管理学',
  '1204': '公共管理学',
  '1205': '信息资源管理',
  '1251': '工商管理',
  '1252': '公共管理',
  '1256': '工程管理',
  '1301': '艺术学',
  '1401': '集成电路科学与工程',
  '1402': '国家安全学',
  '1404': '遥感科学与技术',
  '1406': '纳米科学与工程',
  '1452': '密码科学与技术',
  '9901': '行星科学',
  '99J1': '人居科学',
};

function creditFromValue(value: unknown) {
  const raw =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const parsed = Number(raw.split('/')[1] ?? raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSessions(sessions: RawSession[] = []) {
  return sessions.map((session) => {
    if (session.day && session.periods) return session;
    const match = String(session.dayPeriods ?? '').match(
      /(周[一二三四五六日])\(([^)]+)\)/,
    );
    return { ...session, day: match?.[1] ?? '', periods: match?.[2] ?? '' };
  });
}

function normalizeCourse(
  course: Partial<Course> & {
    hoursCredits?: string;
    examMode?: string;
    property?: string;
    teachers?: string;
    sessions?: RawSession[];
  },
) {
  const sessions = normalizeSessions(course.sessions ?? []);
  return {
    ...course,
    code: String(course.code ?? ''),
    name: String(course.name ?? ''),
    type: String(course.type ?? course.property ?? '其他'),
    credit: Number(course.credit ?? creditFromValue(course.hoursCredits)),
    teacher: String(course.teacher ?? course.teachers ?? ''),
    exam: String(course.exam ?? course.examMode ?? '待确认'),
    place: String(
      course.place ??
        sessions
          .map((item) => item.room)
          .filter(Boolean)
          .join('；'),
    ),
    sessions,
  } as Course;
}

function splitDisciplineValues(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .filter(Boolean)
        .flatMap((value) =>
          String(value)
            .replace(/<br\s*\/?>/gi, '\n')
            .split(/[、,，;/；|／\n\r]+/),
        )
        .map((value) => value.replace(/\s+/g, ' ').trim())
        .filter(Boolean),
    ),
  );
}

function codeDisciplineValues(course: Course) {
  const code = String(course.code ?? '');
  return PRIMARY_DISCIPLINE_BY_CODE[code.slice(6, 10)]
    ? [PRIMARY_DISCIPLINE_BY_CODE[code.slice(6, 10)]]
    : [];
}

function courseCampus(course: Course) {
  const baseCode = String(course.code ?? '')
    .split('-')[0]
    .replace(/\s/g, '');
  const campusCode = baseCode.slice(17, 18).toUpperCase();
  return CAMPUS_BY_CODE_LETTER[campusCode] ?? course.campus ?? '';
}

function comparableDiscipline(value: string) {
  return value.replace(/\s+/g, '').toLocaleLowerCase();
}

function matchingDisciplineIndex(values: string[], discipline: string) {
  const target = comparableDiscipline(discipline);
  if (!target) return -1;
  return values.findIndex((value) => {
    const candidate = comparableDiscipline(value);
    return (
      candidate === target ||
      candidate.includes(target) ||
      target.includes(candidate)
    );
  });
}

function rawDisciplineValues(course: Course) {
  return splitDisciplineValues([
    course.discipline,
    course.sharedDiscipline,
    course.sharedDisciplines,
    course.eligibleDiscipline,
    course.degreeDiscipline,
    course['所属一级学科'],
    course['共享学科'],
    course['共享学科所属一级学科/专业学位'],
    course['共享学科所属一级学科／专业学位'],
  ]);
}

function primaryDisciplineValues(course: Course) {
  const codeValues = codeDisciplineValues(course);
  return splitDisciplineValues([
    ...codeValues,
    course['所属一级学科'],
    course['共享学科所属一级学科/专业学位'],
    course['共享学科所属一级学科／专业学位'],
    ...(codeValues.length ? [] : [course.discipline]),
  ]);
}

function disciplineValues(course: Course) {
  return [
    ...primaryDisciplineValues(course),
    ...rawDisciplineValues(course),
  ].filter((value, index, values) => values.indexOf(value) === index);
}

function sharedEligibleDisciplineValues(course: Course) {
  return splitDisciplineValues([
    course.eligibleDiscipline,
    course.degreeDiscipline,
    course['共享学科所属一级学科/专业学位'],
    course['共享学科所属一级学科／专业学位'],
  ]);
}

function sharedPropertyValues(course: Course) {
  return splitDisciplineValues([
    course.sharedProperty,
    course.sharedProperties,
    course.sharedTypes,
    course.sharedCourseProperty,
    course['共享课程属性'],
    course['共享课程类型'],
  ]);
}

function sharedLevelValues(course: Course) {
  return splitDisciplineValues([
    course.sharedLevel,
    course.sharedLevels,
    course.sharedCourseLevel,
    course['共享课程层次'],
    course['共享课程培养层次'],
  ]);
}

function courseTypeForDiscipline(course: Course, discipline = '') {
  const sharedProperties = sharedPropertyValues(course);
  const sharedIndex = matchingDisciplineIndex(
    sharedEligibleDisciplineValues(course),
    discipline,
  );
  if (sharedIndex < 0 || !sharedProperties.length) return course.type;
  return sharedProperties[sharedIndex] ?? sharedProperties[0] ?? course.type;
}

function courseLevelForDiscipline(course: Course, discipline = '') {
  const sharedLevels = sharedLevelValues(course);
  const sharedIndex = matchingDisciplineIndex(
    sharedEligibleDisciplineValues(course),
    discipline,
  );
  if (sharedIndex < 0 || !sharedLevels.length) return course.level ?? '';
  return sharedLevels[sharedIndex] ?? sharedLevels[0] ?? course.level ?? '';
}

function isCoreCourse(course: Course, discipline = '') {
  return courseTypeForDiscipline(course, discipline).includes('核心');
}

function isProfessionalCourse(course: Course, discipline = '') {
  return courseTypeForDiscipline(course, discipline) === '专业课';
}

function isCoreOrProfessionalCourse(course: Course, discipline = '') {
  return (
    isCoreCourse(course, discipline) || isProfessionalCourse(course, discipline)
  );
}

function matchesDiscipline(course: Course, discipline: string) {
  if (!discipline) return false;
  return matchingDisciplineIndex(disciplineValues(course), discipline) >= 0;
}

function parseWeeks(value: string) {
  const match = String(value ?? '').match(/第([^周]+)周/);
  const weeks = new Set<number>();
  if (!match) return weeks;
  for (const token of match[1].split(',')) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map(Number);
      for (let week = start; week <= end; week += 1) weeks.add(week);
    } else if (/^\d+$/.test(token.trim())) weeks.add(Number(token.trim()));
  }
  return weeks;
}

function parsePeriods(value: string) {
  const periods = new Set<number>();
  for (const token of String(value ?? '').split(',')) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map(Number);
      for (let period = start; period <= end; period += 1) periods.add(period);
    } else if (/^\d+$/.test(token.trim())) periods.add(Number(token.trim()));
  }
  return periods;
}

function intersects(left: Set<number>, right: Set<number>) {
  for (const value of left) if (right.has(value)) return true;
  return false;
}

function hasWeek(course: Course, week: number) {
  return (course.sessions ?? []).some((session) =>
    parseWeeks(String(session.weeks)).has(week),
  );
}

function hasSlot(course: Course, day: string, period: number, week: number) {
  return (course.sessions ?? []).some(
    (session) =>
      session.day === day &&
      parseWeeks(String(session.weeks)).has(week) &&
      parsePeriods(String(session.periods)).has(period),
  );
}

function dateRangeForWeek(week: number) {
  const start = new Date(2026, 7, 31);
  start.setDate(start.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${format(start)}–${format(end)}`;
}

function shortExam(exam: string) {
  if (exam.includes('闭卷')) return '闭卷笔试';
  if (exam.includes('课堂开卷')) return '课堂开卷';
  if (exam.includes('读书报告')) return '读书报告';
  if (exam.includes('文献综述')) return '文献综述';
  if (exam.includes('大开卷')) return '大开卷';
  if (exam.includes('其它')) return '其它需说明';
  return exam || '待确认';
}

function defaultRationale(course: Course) {
  if (course.type.includes('核心'))
    return '核心课程，可优先用于满足培养方案中的核心课结构。';
  if (course.type === '专业课')
    return '专业应用课程，适合扩展相关研究方向的课程基础和应用能力。';
  if (course.name.includes('Python'))
    return '科研工具课程，服务空间数据处理、分析、可视化和后续科研复现。';
  if (course.type.includes('公共'))
    return '公共课程，可根据个人培养方案和学期负荷安排。';
  return '来自项目内置的秋季课程数据，建议结合导师意见和培养方案进一步确认。';
}

function toneForCourse(code: string) {
  const tones = [
    'tone-blue',
    'tone-sage',
    'tone-rose',
    'tone-gold',
    'tone-lilac',
    'tone-cyan',
  ];
  const score = Array.from(code).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return tones[score % tones.length];
}

export default function Home() {
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [plan, setPlan] = useState<Course[]>([]);
  const [degreeCodes, setDegreeCodes] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState(2);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('全部');
  const [onlyNonClosed, setOnlyNonClosed] = useState(false);
  const [campusFilter, setCampusFilter] = useState('全部校区');
  const [catalogPage, setCatalogPage] = useState(1);
  const [studentType, setStudentType] = useState<StudentType>('未选择');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [englishPlan, setEnglishPlan] = useState<EnglishPlan>({
    doctoral: '未选择',
    masters: '未选择',
  });
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [planDirty, setPlanDirty] = useState(false);

  useEffect(() => {
    fetch('/data/courses.json')
      .then((response) => response.json())
      .then((courseData) => {
        const normalizedCatalog = (courseData as Course[]).map(normalizeCourse);
        const stored = window.localStorage.getItem(PLAN_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as {
              storageVersion?: number;
              plan?: Course[];
              degreeCodes?: string[];
              englishPlan?: EnglishPlan;
              studentType?: StudentType;
              selectedDiscipline?: string;
            };
            if (parsed.storageVersion === 1) {
              setPlan((parsed.plan ?? []).map(normalizeCourse));
              setDegreeCodes(new Set(parsed.degreeCodes ?? []));
              setEnglishPlan(
                parsed.englishPlan ?? { doctoral: '未选择', masters: '未选择' },
              );
              setStudentType(parsed.studentType ?? '未选择');
              setSelectedDiscipline(parsed.selectedDiscipline ?? '');
              setPlanDirty(true);
            } else {
              setPlan([]);
              setDegreeCodes(new Set());
              setEnglishPlan({ doctoral: '未选择', masters: '未选择' });
              setStudentType('未选择');
              setSelectedDiscipline('');
            }
          } catch {
            setPlan([]);
            setDegreeCodes(new Set());
            setEnglishPlan({ doctoral: '未选择', masters: '未选择' });
            setStudentType('未选择');
            setSelectedDiscipline('');
          }
        } else {
          setPlan([]);
          setDegreeCodes(new Set());
          setEnglishPlan({ doctoral: '未选择', masters: '未选择' });
          setStudentType('未选择');
          setSelectedDiscipline('');
        }
        setCatalog(normalizedCatalog);
        setReady(true);
      })
      .catch(() => {
        setMessage(
          '课程数据加载失败，请确认 public/data 目录中的课程数据文件存在。',
        );
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (ready && planDirty)
      window.localStorage.setItem(
        PLAN_STORAGE_KEY,
        JSON.stringify({
          storageVersion: 1,
          plan,
          degreeCodes: [...degreeCodes],
          englishPlan,
          studentType,
          selectedDiscipline,
        }),
      );
  }, [
    degreeCodes,
    englishPlan,
    plan,
    planDirty,
    ready,
    selectedDiscipline,
    studentType,
  ]);

  const selectedCodes = useMemo(
    () => new Set(plan.map((course) => course.code)),
    [plan],
  );
  const fallCredits = useMemo(
    () => plan.reduce((sum, course) => sum + course.credit, 0),
    [plan],
  );
  const publicElectiveCredits = useMemo(
    () =>
      plan
        .filter((course) => course.type === '公共选修课')
        .reduce((sum, course) => sum + course.credit, 0),
    [plan],
  );
  const closedCourses = useMemo(
    () => plan.filter((course) => course.exam.includes('闭卷')),
    [plan],
  );
  const conflicts = useMemo(() => {
    const result: Array<[Course, Course]> = [];
    for (let i = 0; i < plan.length; i += 1)
      for (let j = i + 1; j < plan.length; j += 1) {
        const conflict = plan[i].sessions.some((left) =>
          plan[j].sessions.some(
            (right) =>
              left.day === right.day &&
              intersects(
                parseWeeks(String(left.weeks)),
                parseWeeks(String(right.weeks)),
              ) &&
              intersects(
                parsePeriods(String(left.periods)),
                parsePeriods(String(right.periods)),
              ),
          ),
        );
        if (conflict) result.push([plan[i], plan[j]]);
      }
    return result;
  }, [plan]);
  const conflictCodes = useMemo(
    () =>
      new Set(conflicts.flatMap(([left, right]) => [left.code, right.code])),
    [conflicts],
  );
  const disciplineOptions = useMemo(
    () =>
      Array.from(new Set(catalog.flatMap(primaryDisciplineValues))).sort(
        (left, right) => left.localeCompare(right, 'zh-CN'),
      ),
    [catalog],
  );
  const degreePlanCourses = useMemo(
    () =>
      plan.filter(
        (course) =>
          degreeCodes.has(course.code) &&
          isCoreOrProfessionalCourse(course, selectedDiscipline) &&
          matchesDiscipline(course, selectedDiscipline),
      ),
    [degreeCodes, plan, selectedDiscipline],
  );
  const degreeCredits = useMemo(
    () => degreePlanCourses.reduce((sum, course) => sum + course.credit, 0),
    [degreePlanCourses],
  );
  const coreCount = useMemo(
    () =>
      degreePlanCourses.filter((course) =>
        isCoreCourse(course, selectedDiscipline),
      ).length,
    [degreePlanCourses, selectedDiscipline],
  );
  const professionalCount = useMemo(
    () =>
      degreePlanCourses.filter((course) =>
        isProfessionalCourse(course, selectedDiscipline),
      ).length,
    [degreePlanCourses, selectedDiscipline],
  );
  const degreeTarget =
    studentType === '硕士研究生'
      ? 12
      : studentType === '直博研究生'
        ? 16
        : studentType === '普通招考博士研究生'
          ? 4
          : 0;
  const isRegularDoctor = studentType === '普通招考博士研究生';
  const degreeCreditDone =
    studentType !== '未选择' &&
    Boolean(selectedDiscipline) &&
    degreeCredits >= degreeTarget;
  const hasDoctoralCommonOrExclusive = degreePlanCourses.some((course) =>
    /硕博通用|博士/.test(courseLevelForDiscipline(course, selectedDiscipline)),
  );
  const degreeStructureDone =
    studentType !== '未选择' &&
    Boolean(selectedDiscipline) &&
    (isRegularDoctor
      ? hasDoctoralCommonOrExclusive
      : coreCount >= 2 && professionalCount >= 2);
  const degreeCreditCurrent =
    studentType === '未选择' || !selectedDiscipline
      ? '待设置身份与一级学科'
      : `${degreeCredits.toFixed(1)} / ${degreeTarget} 分`;
  const degreeStructureCurrent =
    studentType === '未选择' || !selectedDiscipline
      ? '待设置身份与一级学科'
      : isRegularDoctor
        ? `${degreeCredits.toFixed(1)} / 4 分 · 硕博通用/博士专属课程 ${hasDoctoralCommonOrExclusive ? 1 : 0}/1`
        : `核心 ${coreCount}/2 · 专业 ${professionalCount}/2`;

  const filteredCatalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return catalog.filter((course) => {
      const matchesSearch =
        !needle ||
        `${course.name} ${course.code} ${disciplineValues(course).join(' ')} ${course.teacher}`
          .toLowerCase()
          .includes(needle);
      const matchesType =
        activeType === '全部' ||
        courseTypeForDiscipline(course, selectedDiscipline) === activeType;
      const matchesExam = !onlyNonClosed || !course.exam.includes('闭卷');
      const matchesCampus =
        campusFilter === '全部校区' || courseCampus(course) === campusFilter;
      return matchesSearch && matchesType && matchesExam && matchesCampus;
    });
  }, [
    activeType,
    campusFilter,
    catalog,
    onlyNonClosed,
    search,
    selectedDiscipline,
  ]);
  const catalogPageCount = Math.max(
    1,
    Math.ceil(filteredCatalog.length / PAGE_SIZE),
  );
  const effectiveCatalogPage = Math.min(catalogPage, catalogPageCount);
  const visibleCatalog = filteredCatalog.slice(
    (effectiveCatalogPage - 1) * PAGE_SIZE,
    effectiveCatalogPage * PAGE_SIZE,
  );

  function addCourse(course: Course) {
    if (selectedCodes.has(course.code)) return;
    const nextCourse = {
      ...course,
      rationale: course.rationale ?? defaultRationale(course),
      degreeRole: isCoreOrProfessionalCourse(course, selectedDiscipline)
        ? '建议学位课'
        : '待确认',
    };
    setPlan((current) => [...current, nextCourse]);
    if (nextCourse.degreeRole === '建议学位课')
      setDegreeCodes((current) => new Set([...current, nextCourse.code]));
    setPlanDirty(true);
    setMessage(`已加入：${course.name}`);
  }

  function removeCourse(code: string) {
    setPlan((current) => current.filter((course) => course.code !== code));
    setDegreeCodes((current) => {
      const next = new Set(current);
      next.delete(code);
      return next;
    });
    setPlanDirty(true);
  }

  function toggleDegree(code: string) {
    setDegreeCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setPlanDirty(true);
  }

  function updateEnglishMode(kind: 'doctoral' | 'masters', mode: EnglishMode) {
    setEnglishPlan((current) => ({ ...current, [kind]: mode }));
    setPlanDirty(true);
    setMessage(
      `${kind === 'doctoral' ? '博士英语' : '硕士英语'}已设置为：${mode}`,
    );
  }

  function resetPlan() {
    window.localStorage.removeItem(PLAN_STORAGE_KEY);
    setPlan([]);
    setDegreeCodes(new Set());
    setStudentType('未选择');
    setSelectedDiscipline('');
    setEnglishPlan({ doctoral: '未选择', masters: '未选择' });
    setPlanDirty(false);
    setMessage('已恢复为空方案：0 门课程、0 学分。');
  }

  function downloadBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            plan,
            degreeCodes: [...degreeCodes],
            englishPlan,
            studentType,
            selectedDiscipline,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '国科大博士秋季选课规划备份.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('已下载本机方案备份。');
  }

  function restoreBackup(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawResult =
          typeof reader.result === 'string'
            ? reader.result
            : new TextDecoder().decode(reader.result ?? new ArrayBuffer(0));
        const parsed = JSON.parse(rawResult) as {
          plan: Course[];
          degreeCodes?: string[];
          englishPlan?: EnglishPlan;
          studentType?: StudentType;
          selectedDiscipline?: string;
        };
        setPlan((parsed.plan ?? []).map(normalizeCourse));
        setDegreeCodes(new Set(parsed.degreeCodes ?? []));
        setEnglishPlan(
          parsed.englishPlan ?? { doctoral: '未选择', masters: '未选择' },
        );
        setStudentType(parsed.studentType ?? '未选择');
        setSelectedDiscipline(parsed.selectedDiscipline ?? '');
        setPlanDirty(true);
        setMessage('方案备份已恢复。');
      } catch {
        setMessage('备份文件格式无法识别。');
      }
    };
    reader.readAsText(file);
  }

  const currentWeekCourses = plan.filter((course) => hasWeek(course, week));
  const englishOptions: Array<{
    key: 'doctoral' | 'masters';
    label: string;
    code: string;
    options: EnglishMode[];
  }> =
    studentType === '硕士研究生'
      ? [
          {
            key: 'masters',
            label: '硕士英语',
            code: '英语A',
            options: ['MOOC', '免修', '线下课'],
          },
        ]
      : studentType === '直博研究生' || studentType === '普通招考博士研究生'
        ? [
            {
              key: 'doctoral',
              label: '博士英语',
              code: '英语B',
              options: ['免修', '线下课'],
            },
            {
              key: 'masters',
              label: '硕士英语',
              code: '英语A',
              options: ['MOOC', '免修', '线下课'],
            },
          ]
        : [];

  return (
    <main className="site-shell">
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">2026 秋季 · 博士生课程规划</p>
          <h1>博士选课规划</h1>
          <p className="hero-subtitle">本地优先 · 从空方案开始</p>
          <p className="hero-note">
            将培养要求、时间冲突、考核方式和课程数据放在同一个工作面里，先规划，再去本校选课系统提交。
          </p>
        </div>
        <div className="hero-status">
          <div className="status-top">
            <span className="status-dot" />
            规划器已就绪
          </div>
          <p>秋季方案</p>
          <strong>
            {fallCredits.toFixed(1)} <small>本学期已选学分</small>
          </strong>
          <div className="status-foot">
            <span>{plan.length} 门课程</span>
            <span>
              {closedCourses.length === 0
                ? '无闭卷课程'
                : `${closedCourses.length} 门闭卷`}
            </span>
          </div>
        </div>
      </section>

      <section className="rule-strip wrap" aria-label="培养规则速览">
        <span>秋季 ≥10 分</span>
        <span>春季 ≥10 分</span>
        <span>夏季 ≥2 分</span>
        <span>核心课 ≥2 门</span>
        <span>
          {studentType === '硕士研究生'
            ? '学位课 ≥12 分'
            : studentType === '普通招考博士研究生'
              ? '专业学位课 ≥4 分'
              : '学位课 ≥16 分'}
        </span>
        <span>总学分 ≥38 分</span>
      </section>

      <section className="settings-panel wrap panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">个性化规则检查</p>
            <h2>先设置身份与一级学科</h2>
          </div>
          <span className="status">仅保存在本机</span>
        </div>
        <div className="settings-grid">
          <label className="select-field">
            <span>研究生身份</span>
            <select
              value={studentType}
              onChange={(event) => {
                setStudentType(event.target.value as StudentType);
                setPlanDirty(true);
              }}
            >
              <option value="未选择">请选择身份</option>
              {STUDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span>本人一级学科</span>
            <select
              value={selectedDiscipline}
              onChange={(event) => {
                setSelectedDiscipline(event.target.value);
                setPlanDirty(true);
              }}
            >
              <option value="">请选择一级学科</option>
              {disciplineOptions.map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="settings-note">
          只有课程数据中的“所属一级学科/共享学科所属一级学科”匹配所选学科时，核心课和专业课才计入
          2+2 学位课结构；其他课程仍可加入，但会标记为补充课程。
        </p>
      </section>

      <section className="metrics wrap">
        <Metric
          label="本学期有效学分"
          value={fallCredits.toFixed(1)}
          target="/ 10 分"
          tone="mint"
          good={fallCredits >= 10}
        />
        <Metric
          label="学位课"
          value={degreeCredits.toFixed(1)}
          target={
            studentType === '硕士研究生'
              ? '/ 12 分'
              : studentType === '普通招考博士研究生'
                ? '/ 4 分'
                : '/ 16 分'
          }
          tone="blue"
          good={degreeCreditDone}
        />
        <Metric
          label="匹配一级学科的核心课"
          value={String(coreCount)}
          target="/ 2 门"
          tone="rose"
          good={
            studentType !== '未选择' &&
            Boolean(selectedDiscipline) &&
            (!isRegularDoctor ? coreCount >= 2 : hasDoctoralCommonOrExclusive)
          }
        />
        <Metric
          label="匹配一级学科的专业课"
          value={String(professionalCount)}
          target="/ 2 门"
          tone="gold"
          good={
            studentType !== '未选择' &&
            Boolean(selectedDiscipline) &&
            (!isRegularDoctor ? professionalCount >= 2 : degreeCredits >= 4)
          }
        />
        <Metric
          label="公共选修"
          value={publicElectiveCredits.toFixed(1)}
          target="/ 2 分"
          tone="lilac"
          good={publicElectiveCredits >= 2}
        />
      </section>

      <section className="english-panel wrap panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">公共必修 · 英语</p>
            <h2>英语课程选择</h2>
          </div>
          <span className="status">按适用情况选择</span>
        </div>
        <p className="english-intro">
          {studentType === '未选择'
            ? '请先在上方选择研究生身份，系统会显示对应的英语课程路径。'
            : '选择线下课后，请在下方课程目录中搜索对应课程并加入计划。免修或 MOOC 是否计入学分，以官方审核结果为准，规划器不会自动增加课程学分。'}
        </p>
        <div className="english-options">
          {englishOptions.map((item) => (
            <div className="english-option" key={item.key}>
              <div className="english-option-head">
                <div>
                  <b>{item.label}</b>
                  <span>{item.code}</span>
                </div>
                <strong>{englishPlan[item.key]}</strong>
              </div>
              <div className="english-buttons">
                {item.options.map((mode) => (
                  <button
                    key={mode}
                    className={englishPlan[item.key] === mode ? 'active' : ''}
                    onClick={() => updateEnglishMode(item.key, mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {englishPlan[item.key] === '线下课' && (
                <a
                  className="english-link"
                  href="#catalog"
                  onClick={() => {
                    setSearch(item.code);
                    setCatalogPage(1);
                  }}
                >{`在课程目录中查看${item.code}班级 →`}</a>
              )}
            </div>
          ))}
          {studentType === '未选择' && (
            <div className="english-empty">
              选择身份后显示适用的英语课程选项。
            </div>
          )}
        </div>
      </section>

      <section className="workspace wrap">
        <div className="plan-panel panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">我的课程</p>
              <h2>已选课程</h2>
            </div>
            <span className={conflicts.length ? 'status danger' : 'status'}>
              {conflicts.length
                ? `${conflicts.length} 处时间冲突`
                : '无时间冲突'}
            </span>
          </div>
          <div className="plan-toolbar">
            <span>课程库来自项目内置数据文件</span>
            <button className="text-button" onClick={resetPlan}>
              <RotateCcw size={14} />
              恢复为空方案
            </button>
          </div>
          <div className="selected-list">
            {plan.length ? (
              plan.map((course) => (
                <article
                  className={`selected-card ${toneForCourse(course.code)}`}
                  key={course.code}
                >
                  <div className="card-color" />
                  <div className="selected-main">
                    <div className="selected-title">
                      <h3>{course.name}</h3>
                      <span className="credit-badge">{course.credit} 学分</span>
                    </div>
                    <p className="course-meta">
                      {courseTypeForDiscipline(course, selectedDiscipline)} ·{' '}
                      {shortExam(course.exam)}
                    </p>
                    {isCoreOrProfessionalCourse(course, selectedDiscipline) && (
                      <span
                        className={`discipline-match ${selectedDiscipline && matchesDiscipline(course, selectedDiscipline) ? 'match' : 'supplement'}`}
                      >
                        {selectedDiscipline
                          ? matchesDiscipline(course, selectedDiscipline)
                            ? `一级学科匹配：${selectedDiscipline}`
                            : '非所选一级学科：仅作补充课程'
                          : '尚未选择一级学科，暂无法核验'}
                      </span>
                    )}
                    <p className="course-schedule">
                      {course.sessions.length
                        ? course.sessions
                            .map(
                              (session) =>
                                `${session.day} ${session.periods}（${session.weeks}）`,
                            )
                            .join('；')
                        : '线上课程 · 无固定课堂时段'}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button
                      className={
                        degreeCodes.has(course.code)
                          ? 'degree-toggle active'
                          : 'degree-toggle'
                      }
                      onClick={() => toggleDegree(course.code)}
                      title="切换是否计入专业学位课"
                    >
                      <BookOpenCheck size={14} />
                      {degreeCodes.has(course.code) ? '学位课' : '非学位课'}
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => removeCourse(course.code)}
                      title="移出方案"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-plan">
                <b>还没有加入课程</b>
                <span>
                  从下方课程目录加入第一门课，学分、冲突和周课表会自动更新。
                </span>
              </div>
            )}
          </div>
          <div className="important-note">
            <b>
              <Info size={16} />
              学位课请最终确认
            </b>
            <span>
              学位课标记只代表规划判断，是否计入培养方案仍需导师、培养单位和选课系统审核。
            </span>
          </div>
        </div>

        <aside className="checks-panel panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">培养要求检查</p>
              <h2>当前进度</h2>
            </div>
            <Layers3 size={20} className="muted-icon" />
          </div>
          <Requirement
            label="秋季有效学分"
            current={`${fallCredits.toFixed(1)} / 10 分`}
            done={fallCredits >= 10}
            note="不计未转换的人文系列与科学前沿讲座"
          />
          <Requirement
            label="符合一级学科的学位课"
            current={degreeCreditCurrent}
            done={degreeCreditDone}
            note="只统计勾选为学位课且匹配所选一级学科的核心课/专业课"
          />
          <Requirement
            label={isRegularDoctor ? '普博学位课结构' : '2+2 学位课结构'}
            current={degreeStructureCurrent}
            done={degreeStructureDone}
            note={
              isRegularDoctor
                ? '至少1门本一级学科硕博通用或博士专属核心课/专业课'
                : '本一级学科至少2门核心课+2门专业课'
            }
          />
          <Requirement
            label="公共选修"
            current={`${publicElectiveCredits.toFixed(1)} / 2 分`}
            done={publicElectiveCredits >= 2}
            note="公共选修学分可按个人培养方案分学期安排"
          />
          <div className="public-requirement">
            <p>公共必修核对</p>
            <span className="requirement-line">
              <CheckCircle2 size={15} />
              政治类公共必修：按培养方案核对
            </span>
            <span className="requirement-line">
              <CheckCircle2 size={15} />
              英语类课程：按学位类型和免修情况核对
            </span>
            <span className="requirement-line">
              <CheckCircle2 size={15} />
              学术道德与学术写作规范：按院系要求核对
            </span>
            <span className="requirement-line pending">
              <AlertTriangle size={15} />
              本面板为规划辅助，不替代官方培养方案
            </span>
          </div>
          <div className="next-term">
            <b>后续安排</b>
            <span>春季 ≥10 分 · 夏季 ≥2 分</span>
            <span>全程总学分 ≥38 分</span>
          </div>
        </aside>
      </section>

      <section className="rules-panel wrap panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">官方规则摘要</p>
            <h2>课程属性与选课注意事项</h2>
          </div>
          <span className="status">以培养单位最新通知为准</span>
        </div>
        <div className="rules-grid">
          <details open>
            <summary>课程属性与课程编码</summary>
            <p>
              课程编号第 14 位代表课程属性：1 学科核心课、2 专业核心课、3
              专业课、4 研讨课、5 实验课、6 实践课、7 科学前沿讲座、B
              公共必修课、X 公共选修课。
            </p>
            <p>
              课程编号第 18 位代表开课校区：H 雁栖湖、Y 玉泉路、Z 中关村；第 13
              位代表培养层次：M 硕士、D 博士、P 硕博通用/博士通用课程。
            </p>
            <p className="rule-warning">
              集中教学研究生不能跨雁栖湖校区和城区校区选课；研讨课、实验课、实践课和两类讲座只能作为非学位课修读。
            </p>
          </details>
          <details>
            <summary>公共必修课</summary>
            <p>
              公共必修课按培养方案核对。常见课程包括新时代中国特色社会主义理论与实践（2
              学分）、自然辩证法概论（1 学分）、学术道德与学术写作规范（1
              学分）、中国马克思主义与当代（2
              学分），以及按身份适用的硕士英语或博士英语。
            </p>
            <p>
              学术道德与学术写作规范通常需要在同一学年内完成；硕士英语、博士英语的免修、慕课、线下课和考试要求以外语系及教务通知为准。
            </p>
            <p className="rule-warning">
              公共必修课中的分班课名额有限，请按身份和培养方案选择正确课程，不要仅凭课程名称判断是否计入学位要求。
            </p>
          </details>
          <details>
            <summary>公共选修课</summary>
            <p>
              硕士生、硕博连读生和直博生秋季、春季每学期至少修读 2
              学分公共选修课；夏季学期可作为补充，课程名额通常有限。
            </p>
            <p>
              课程编号第 14 位为 X
              的课程属于公共选修课，实行限选、先到先得；体育类公共选修课每学期限选
              1 门。
            </p>
            <p className="rule-warning">
              公共选修课能否计入培养方案、课程属性是否发生变化，请以选课系统显示和培养单位审核结果为准。
            </p>
          </details>
        </div>
      </section>

      <section className="timetable wrap">
        <div className="timetable-head">
          <div>
            <p className="eyebrow">实时课程表</p>
            <h2>
              第 {week} 教学周 <small>{dateRangeForWeek(week)}</small>
            </h2>
          </div>
          <div className="week-actions">
            <button
              className="round-button"
              onClick={() => setWeek(Math.max(1, week - 1))}
              disabled={week === 1}
            >
              <ChevronLeft size={17} />
            </button>
            <div className="week-jump">
              {Array.from({ length: 19 }, (_, index) => index + 1).map(
                (item) => (
                  <button
                    key={item}
                    className={item === week ? 'active' : ''}
                    onClick={() => setWeek(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <button
              className="round-button"
              onClick={() => setWeek(Math.min(19, week + 1))}
              disabled={week === 19}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        {conflicts.length > 0 && (
          <div className="conflict-summary">
            <b>时间冲突高亮</b>
            <span>同一教学周、同一天次出现的课程会以独立浮动卡片标红：</span>
            {conflicts.slice(0, 6).map(([left, right]) => (
              <span
                className="conflict-chip"
                key={`${left.code}-${right.code}`}
              >
                {left.name} × {right.name}
              </span>
            ))}
            {conflicts.length > 6 && (
              <span className="conflict-chip">
                另有 {conflicts.length - 6} 处
              </span>
            )}
          </div>
        )}
        <div className="calendar-wrap">
          <div className="calendar-grid">
            <div className="calendar-cell calendar-head time-head">
              节次 / 时间
            </div>
            {DAYS.map((day) => (
              <div className="calendar-cell calendar-head" key={day}>
                {day}
              </div>
            ))}
            {PERIODS.map(([period, time]) => (
              <div className="calendar-row" key={period}>
                <div className="calendar-cell time-cell">
                  <b>{period}</b>
                  <span>{time}</span>
                </div>
                {DAYS.map((day) => {
                  const courses = currentWeekCourses.filter((course) =>
                    hasSlot(course, day, Number(period), week),
                  );
                  const cellConflict = courses.length > 1;
                  return (
                    <div
                      className={`calendar-cell lesson-cell ${cellConflict ? 'has-conflict' : ''}`}
                      key={`${day}-${period}`}
                    >
                      {cellConflict && (
                        <span className="cell-conflict-label">冲突</span>
                      )}
                      <div
                        className={`lesson-stack ${cellConflict ? 'conflict-stack' : ''}`}
                      >
                        {courses.map((course) => {
                          const courseConflict =
                            cellConflict && conflictCodes.has(course.code);
                          return (
                            <div
                              className={`lesson ${toneForCourse(course.code)} ${courseConflict ? 'lesson-conflict' : ''}`}
                              key={`${course.code}-${day}-${period}`}
                            >
                              <b>{course.name}</b>
                              <span>
                                {course.place || '线上'} · {course.credit}分
                              </span>
                              {courseConflict && <em>与其他课程冲突</em>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="calendar-caption">
          <CalendarDays size={15} />
          课表按当前教学周显示；红色浮动卡片表示当前周次存在同一时间冲突。
        </div>
      </section>

      <section className="catalog wrap" id="catalog">
        <div className="catalog-top">
          <div>
            <p className="eyebrow">课程目录</p>
            <h2>从课程库加入方案</h2>
            <p className="catalog-summary">
              已加载 {catalog.length} 门课程 · 筛选后 {filteredCatalog.length}{' '}
              门 · 当前第 {effectiveCatalogPage}/{catalogPageCount} 页
            </p>
          </div>
          <div className="data-actions">
            <button className="quiet-button" onClick={downloadBackup}>
              <Download size={15} />
              下载备份
            </button>
            <label className="quiet-button file-label">
              <Upload size={15} />
              恢复备份
              <input
                type="file"
                accept="application/json"
                onChange={(event) => restoreBackup(event.target.files?.[0])}
              />
            </label>
            <button
              className="quiet-button danger-button"
              onClick={() => {
                window.localStorage.removeItem(PLAN_STORAGE_KEY);
                setPlan([]);
                setDegreeCodes(new Set());
                setStudentType('未选择');
                setSelectedDiscipline('');
                setEnglishPlan({ doctoral: '未选择', masters: '未选择' });
                setMessage('已清除本机保存的方案，当前为0学分空方案。');
              }}
            >
              <Trash2 size={15} />
              清除本机数据
            </button>
          </div>
        </div>
        <div className="filter-sections">
          <div className="filter-row">
            <span className="filter-label">搜索课程</span>
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCatalogPage(1);
                }}
                placeholder="课程名称、课程代码、教师或学科"
              />
            </label>
            <label className="switch-label">
              <input
                type="checkbox"
                checked={onlyNonClosed}
                onChange={(event) => {
                  setOnlyNonClosed(event.target.checked);
                  setCatalogPage(1);
                }}
              />
              <span className="switch" />
              只看非闭卷
            </label>
          </div>
          <div className="filter-row type-row">
            <span className="filter-label">
              <Filter size={15} />
              课程类型
            </span>
            <div className="type-buttons">
              {COURSE_TYPES.map((type) => (
                <button
                  key={type}
                  className={activeType === type ? 'active' : ''}
                  onClick={() => {
                    setActiveType(type);
                    setCatalogPage(1);
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row campus-row">
            <span className="filter-label">开设校区</span>
            <div className="campus-buttons">
              {CAMPUSES.map((campus) => (
                <button
                  key={campus}
                  className={campusFilter === campus ? 'active' : ''}
                  onClick={() => {
                    setCampusFilter(campus);
                    setCatalogPage(1);
                  }}
                >
                  {campus}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="course-table-wrap">
          <table className="course-table">
            <thead>
              <tr>
                <th>操作</th>
                <th>课程</th>
                <th>属性 / 学科</th>
                <th>学分</th>
                <th>教学周与节次</th>
                <th>考核</th>
                <th>教师</th>
              </tr>
            </thead>
            <tbody>
              {visibleCatalog.map((course) => {
                const isSelected = selectedCodes.has(course.code);
                const isClosed = course.exam.includes('闭卷');
                return (
                  <tr
                    key={course.code}
                    className={isClosed ? 'closed-row' : ''}
                  >
                    <td>
                      <button
                        className={
                          isSelected
                            ? 'added-button selected-toggle'
                            : 'add-button'
                        }
                        onClick={() =>
                          isSelected
                            ? removeCourse(course.code)
                            : addCourse(course)
                        }
                      >
                        {isSelected ? (
                          <>
                            <Check size={14} />
                            取消选课
                          </>
                        ) : (
                          '+ 加入'
                        )}
                      </button>
                    </td>
                    <td>
                      <b>{course.name}</b>
                      <small>{course.code}</small>
                    </td>
                    <td>
                      <span className="type-pill">
                        {courseTypeForDiscipline(course, selectedDiscipline)}
                      </span>
                      <small>
                        {disciplineValues(course).join(' / ') || '公共课'}
                      </small>
                    </td>
                    <td className="credit-cell">{course.credit.toFixed(1)}</td>
                    <td>
                      {course.sessions.length
                        ? course.sessions
                            .map(
                              (session) =>
                                `${session.day} ${session.periods} · ${session.weeks}`,
                            )
                            .join('；')
                        : '线上 / 无固定时段'}
                    </td>
                    <td>
                      <span
                        className={isClosed ? 'exam-pill closed' : 'exam-pill'}
                      >
                        {shortExam(course.exam)}
                      </span>
                    </td>
                    <td>{course.teacher || '待定'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCatalog.length === 0 && (
            <div className="empty-state">
              没有符合条件的课程。可以放宽搜索条件或关闭“只看非闭卷”。
            </div>
          )}
        </div>
        <div className="pagination" aria-label="课程目录分页">
          <button
            onClick={() =>
              setCatalogPage((current) => Math.max(1, current - 1))
            }
            disabled={effectiveCatalogPage === 1}
          >
            <ChevronLeft size={14} />
            上一页
          </button>
          {Array.from(
            { length: catalogPageCount },
            (_, index) => index + 1,
          ).map((item) => (
            <button
              key={item}
              className={item === effectiveCatalogPage ? 'active' : ''}
              onClick={() => setCatalogPage(item)}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() =>
              setCatalogPage((current) =>
                Math.min(catalogPageCount, current + 1),
              )
            }
            disabled={effectiveCatalogPage === catalogPageCount}
          >
            下一页
            <ChevronRight size={14} />
          </button>
        </div>
        <p className="local-note">
          <Info size={14} />
          本机存储已开启：加入课程、学位课勾选和方案备份只保存在这台电脑的浏览器中。课程库来自项目内置的
          Excel 提取数据；更新数据时替换 <code>
            public/data/courses.json
          </code>{' '}
          后重新启动即可。
        </p>
      </section>

      {message && (
        <output className="toast">
          {message}
          <button onClick={() => setMessage('')}>
            <X size={15} />
          </button>
        </output>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  target,
  tone,
  good,
}: {
  label: string;
  value: string;
  target: string;
  tone: string;
  good: boolean;
}) {
  return (
    <div className={`metric ${tone}`}>
      <p>{label}</p>
      <strong>
        {value} <small>{target}</small>
      </strong>
      <span className={good ? 'metric-check good' : 'metric-check'}>
        {good ? '已满足' : '待补齐'}
      </span>
    </div>
  );
}

function Requirement({
  label,
  current,
  done,
  note,
}: {
  label: string;
  current: string;
  done: boolean;
  note: string;
}) {
  return (
    <div className="requirement">
      <b>
        <span className={done ? 'check-circle done' : 'check-circle'}>
          {done ? <Check size={12} /> : '·'}
        </span>
        {label}
      </b>
      <span>
        {current}；{note}。
      </span>
    </div>
  );
}
