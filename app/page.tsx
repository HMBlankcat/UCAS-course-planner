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

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIODS = [
  ['1', '08:30–09:15'], ['2', '09:20–10:05'], ['3', '10:25–11:10'], ['4', '11:15–12:00'],
  ['5', '13:30–14:15'], ['6', '14:20–15:05'], ['7', '15:25–16:10'], ['8', '16:15–17:00'],
  ['9', '17:05–17:50'], ['10', '18:30–19:15'], ['11', '19:20–20:05'], ['12', '20:15–21:00'], ['13', '21:05–21:50'],
];
const COURSE_TYPES = ['全部', '学科核心课', '专业核心课', '专业课', '公共必修课', '公共选修课', '研讨课', '实践课', '实验课'];
const PLAN_STORAGE_KEY = 'ucas-graduate-course-planner-v3';

function creditFromValue(value: unknown) {
  const raw = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const parsed = Number(raw.split('/')[1] ?? raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSessions(sessions: RawSession[] = []) {
  return sessions.map((session) => {
    if (session.day && session.periods) return session;
    const match = String(session.dayPeriods ?? '').match(/(周[一二三四五六日])\(([^)]+)\)/);
    return { ...session, day: match?.[1] ?? '', periods: match?.[2] ?? '' };
  });
}

function normalizeCourse(course: Partial<Course> & { hoursCredits?: string; examMode?: string; property?: string; teachers?: string; sessions?: RawSession[] }) {
  const sessions = normalizeSessions(course.sessions ?? []);
  return {
    ...course,
    code: String(course.code ?? ''),
    name: String(course.name ?? ''),
    type: String(course.type ?? course.property ?? '其他'),
    credit: Number(course.credit ?? creditFromValue(course.hoursCredits)),
    teacher: String(course.teacher ?? course.teachers ?? ''),
    exam: String(course.exam ?? course.examMode ?? '待确认'),
    place: String(course.place ?? sessions.map((item) => item.room).filter(Boolean).join('；')),
    sessions,
  } as Course;
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
  return (course.sessions ?? []).some((session) => parseWeeks(String(session.weeks)).has(week));
}

function hasSlot(course: Course, day: string, period: number, week: number) {
  return (course.sessions ?? []).some((session) => session.day === day && parseWeeks(String(session.weeks)).has(week) && parsePeriods(String(session.periods)).has(period));
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
  if (course.type.includes('核心')) return '核心课程，可优先用于满足培养方案中的核心课结构。';
  if (course.type === '专业课') return '专业应用课程，适合扩展相关研究方向的课程基础和应用能力。';
  if (course.name.includes('Python')) return '科研工具课程，服务空间数据处理、分析、可视化和后续科研复现。';
  if (course.type.includes('公共')) return '公共课程，可根据个人培养方案和学期负荷安排。';
  return '来自项目内置的秋季课程数据，建议结合导师意见和培养方案进一步确认。';
}

function toneForCourse(code: string) {
  const tones = ['tone-blue', 'tone-sage', 'tone-rose', 'tone-gold', 'tone-lilac', 'tone-cyan'];
  const score = Array.from(code).reduce((sum, char) => sum + char.charCodeAt(0), 0);
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
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [planDirty, setPlanDirty] = useState(false);

  useEffect(() => {
    fetch('/data/courses.json').then((response) => response.json()).then((courseData) => {
      const normalizedCatalog = (courseData as Course[]).map(normalizeCourse);
      const stored = window.localStorage.getItem(PLAN_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { storageVersion?: number; plan?: Course[]; degreeCodes?: string[] };
          if (parsed.storageVersion === 1) {
            setPlan((parsed.plan ?? []).map(normalizeCourse));
            setDegreeCodes(new Set(parsed.degreeCodes ?? []));
            setPlanDirty(true);
          } else {
            setPlan([]);
            setDegreeCodes(new Set());
          }
        } catch {
          setPlan([]);
          setDegreeCodes(new Set());
        }
      } else {
        setPlan([]);
        setDegreeCodes(new Set());
      }
      setCatalog(normalizedCatalog);
      setReady(true);
    }).catch(() => {
      setMessage('课程数据加载失败，请确认 public/data 目录中的课程数据文件存在。');
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready && planDirty) window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ storageVersion: 1, plan, degreeCodes: [...degreeCodes] }));
  }, [degreeCodes, plan, planDirty, ready]);

  const selectedCodes = useMemo(() => new Set(plan.map((course) => course.code)), [plan]);
  const fallCredits = useMemo(() => plan.reduce((sum, course) => sum + course.credit, 0), [plan]);
  const degreeCredits = useMemo(() => plan.filter((course) => degreeCodes.has(course.code)).reduce((sum, course) => sum + course.credit, 0), [degreeCodes, plan]);
  const coreCount = useMemo(() => plan.filter((course) => degreeCodes.has(course.code) && course.type.includes('核心')).length, [degreeCodes, plan]);
  const professionalCount = useMemo(() => plan.filter((course) => degreeCodes.has(course.code) && course.type === '专业课').length, [degreeCodes, plan]);
  const publicElectiveCredits = useMemo(() => plan.filter((course) => course.type === '公共选修课').reduce((sum, course) => sum + course.credit, 0), [plan]);
  const closedCourses = useMemo(() => plan.filter((course) => course.exam.includes('闭卷')), [plan]);
  const conflicts = useMemo(() => {
    const result: Array<[Course, Course]> = [];
    for (let i = 0; i < plan.length; i += 1) for (let j = i + 1; j < plan.length; j += 1) {
      const conflict = plan[i].sessions.some((left) => plan[j].sessions.some((right) => left.day === right.day && intersects(parseWeeks(String(left.weeks)), parseWeeks(String(right.weeks))) && intersects(parsePeriods(String(left.periods)), parsePeriods(String(right.periods)))));
      if (conflict) result.push([plan[i], plan[j]]);
    }
    return result;
  }, [plan]);

  const filteredCatalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return catalog.filter((course) => {
      const matchesSearch = !needle || `${course.name} ${course.code} ${course.discipline ?? ''} ${course.teacher}`.toLowerCase().includes(needle);
      const matchesType = activeType === '全部' || course.type === activeType;
      const matchesExam = !onlyNonClosed || !course.exam.includes('闭卷');
      return matchesSearch && matchesType && matchesExam;
    }).slice(0, 80);
  }, [activeType, catalog, onlyNonClosed, search]);

  function addCourse(course: Course) {
    if (selectedCodes.has(course.code)) return;
    const nextCourse = { ...course, rationale: course.rationale ?? defaultRationale(course), degreeRole: course.type.includes('核心') || course.type === '专业课' ? '建议学位课' : '待确认' };
    setPlan((current) => [...current, nextCourse]);
    if (nextCourse.degreeRole === '建议学位课') setDegreeCodes((current) => new Set([...current, nextCourse.code]));
    setPlanDirty(true);
    setMessage(`已加入：${course.name}`);
  }

  function removeCourse(code: string) {
    setPlan((current) => current.filter((course) => course.code !== code));
    setDegreeCodes((current) => { const next = new Set(current); next.delete(code); return next; });
    setPlanDirty(true);
  }

  function toggleDegree(code: string) {
    setDegreeCodes((current) => { const next = new Set(current); if (next.has(code)) next.delete(code); else next.add(code); return next; });
    setPlanDirty(true);
  }

  function resetPlan() {
    window.localStorage.removeItem(PLAN_STORAGE_KEY);
    setPlan([]);
    setDegreeCodes(new Set());
    setPlanDirty(false);
    setMessage('已恢复为空方案：0 门课程、0 学分。');
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), plan, degreeCodes: [...degreeCodes] }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = '国科大博士秋季选课规划备份.json'; anchor.click(); URL.revokeObjectURL(url);
    setMessage('已下载本机方案备份。');
  }

  function restoreBackup(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawResult = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result ?? new ArrayBuffer(0));
        const parsed = JSON.parse(rawResult) as { plan: Course[]; degreeCodes?: string[] };
        setPlan((parsed.plan ?? []).map(normalizeCourse)); setDegreeCodes(new Set(parsed.degreeCodes ?? [])); setPlanDirty(true); setMessage('方案备份已恢复。');
      } catch { setMessage('备份文件格式无法识别。'); }
    };
    reader.readAsText(file);
  }

  const currentWeekCourses = plan.filter((course) => hasWeek(course, week));

  return (
    <main className="site-shell">
      <section className="hero wrap"><div className="hero-copy"><p className="eyebrow">2026 秋季 · 博士生课程规划</p><h1>博士选课规划</h1><p className="hero-subtitle">本地优先 · 从空方案开始</p><p className="hero-note">将培养要求、时间冲突、考核方式和课程数据放在同一个工作面里，先规划，再去本校选课系统提交。</p></div><div className="hero-status"><div className="status-top"><span className="status-dot" />规划器已就绪</div><p>秋季方案</p><strong>{fallCredits.toFixed(1)} <small>本学期已选学分</small></strong><div className="status-foot"><span>{plan.length} 门课程</span><span>{closedCourses.length === 0 ? '无闭卷课程' : `${closedCourses.length} 门闭卷`}</span></div></div></section>

      <section className="rule-strip wrap" aria-label="培养规则速览"><span>秋季 ≥10 分</span><span>春季 ≥10 分</span><span>夏季 ≥2 分</span><span>核心课 ≥2 门</span><span>专业学位课 ≥16 分</span><span>总学分 ≥38 分</span></section>

      <section className="metrics wrap"><Metric label="本学期有效学分" value={fallCredits.toFixed(1)} target="/ 10 分" tone="mint" good={fallCredits >= 10} /><Metric label="专业学位课" value={degreeCredits.toFixed(1)} target="/ 16 分" tone="blue" good={degreeCredits >= 16} /><Metric label="核心课" value={String(coreCount)} target="/ 2 门" tone="rose" good={coreCount >= 2} /><Metric label="专业课" value={String(professionalCount)} target="/ 2 门" tone="gold" good={professionalCount >= 2} /><Metric label="公共选修" value={publicElectiveCredits.toFixed(1)} target="/ 2 分" tone="lilac" good={publicElectiveCredits >= 2} /></section>

      <section className="workspace wrap"><div className="plan-panel panel"><div className="section-head"><div><p className="eyebrow">我的课程</p><h2>已选课程</h2></div><span className={conflicts.length ? 'status danger' : 'status'}>{conflicts.length ? `${conflicts.length} 处时间冲突` : '无时间冲突'}</span></div><div className="plan-toolbar"><span>课程库来自项目内置数据文件</span><button className="text-button" onClick={resetPlan}><RotateCcw size={14} />恢复为空方案</button></div><div className="selected-list">{plan.length ? plan.map((course) => <article className={`selected-card ${toneForCourse(course.code)}`} key={course.code}><div className="card-color" /><div className="selected-main"><div className="selected-title"><h3>{course.name}</h3><span className="credit-badge">{course.credit} 学分</span></div><p className="course-meta">{course.type} · {course.teacher || '教师待定'} · {shortExam(course.exam)}</p><p className="course-schedule">{course.sessions.length ? course.sessions.map((session) => `${session.day} ${session.periods}（${session.weeks}）`).join('；') : '线上课程 · 无固定课堂时段'}</p></div><div className="card-actions"><button className={degreeCodes.has(course.code) ? 'degree-toggle active' : 'degree-toggle'} onClick={() => toggleDegree(course.code)} title="切换是否计入专业学位课"><BookOpenCheck size={14} />{degreeCodes.has(course.code) ? '学位课' : '非学位课'}</button><button className="icon-button" onClick={() => removeCourse(course.code)} title="移出方案"><X size={16} /></button></div></article>) : <div className="empty-plan"><b>还没有加入课程</b><span>从下方课程目录加入第一门课，学分、冲突和周课表会自动更新。</span></div>}</div><div className="important-note"><b><Info size={16} />学位课请最终确认</b><span>学位课标记只代表规划判断，是否计入培养方案仍需导师、培养单位和选课系统审核。</span></div></div>

        <aside className="checks-panel panel"><div className="section-head"><div><p className="eyebrow">培养要求检查</p><h2>当前进度</h2></div><Layers3 size={20} className="muted-icon" /></div><Requirement label="秋季有效学分" current={`${fallCredits.toFixed(1)} / 10 分`} done={fallCredits >= 10} note="不计未转换的人文系列与科学前沿讲座" /><Requirement label="专业学位课" current={`${degreeCredits.toFixed(1)} / 16 分`} done={degreeCredits >= 16} note="按当前勾选为学位课的课程统计" /><Requirement label="学位课结构" current={`核心 ${coreCount}/2 · 专业 ${professionalCount}/2`} done={coreCount >= 2 && professionalCount >= 2} note="至少2门核心课+2门专业课" /><Requirement label="公共选修" current={`${publicElectiveCredits.toFixed(1)} / 2 分`} done={publicElectiveCredits >= 2} note="公共选修学分可按个人培养方案分学期安排" /><div className="public-requirement"><p>公共必修核对</p><span className="requirement-line"><CheckCircle2 size={15} />政治类公共必修：按培养方案核对</span><span className="requirement-line"><CheckCircle2 size={15} />英语类课程：按学位类型和免修情况核对</span><span className="requirement-line"><CheckCircle2 size={15} />学术道德与学术写作规范：按院系要求核对</span><span className="requirement-line pending"><AlertTriangle size={15} />本面板为规划辅助，不替代官方培养方案</span></div><div className="next-term"><b>后续安排</b><span>春季 ≥10 分 · 夏季 ≥2 分</span><span>全程总学分 ≥38 分</span></div></aside></section>

      <section className="timetable wrap"><div className="timetable-head"><div><p className="eyebrow">实时课程表</p><h2>第 {week} 教学周 <small>{dateRangeForWeek(week)}</small></h2></div><div className="week-actions"><button className="round-button" onClick={() => setWeek(Math.max(1, week - 1))} disabled={week === 1}><ChevronLeft size={17} /></button><div className="week-jump">{Array.from({ length: 19 }, (_, index) => index + 1).map((item) => <button key={item} className={item === week ? 'active' : ''} onClick={() => setWeek(item)}>{item}</button>)}</div><button className="round-button" onClick={() => setWeek(Math.min(19, week + 1))} disabled={week === 19}><ChevronRight size={17} /></button></div></div><div className="calendar-wrap"><div className="calendar-grid"><div className="calendar-cell calendar-head time-head">节次 / 时间</div>{DAYS.map((day) => <div className="calendar-cell calendar-head" key={day}>{day}</div>)}{PERIODS.map(([period, time]) => <div className="calendar-row" key={period}><div className="calendar-cell time-cell"><b>{period}</b><span>{time}</span></div>{DAYS.map((day) => { const courses = currentWeekCourses.filter((course) => hasSlot(course, day, Number(period), week)); return <div className="calendar-cell lesson-cell" key={`${day}-${period}`}>{courses.map((course) => <div className={`lesson ${toneForCourse(course.code)}`} key={`${course.code}-${day}-${period}`}><b>{course.name}</b><span>{course.place || '线上'} · {course.credit}分</span></div>)}</div>; })}</div>)}</div></div><div className="calendar-caption"><CalendarDays size={15} />课表按当前教学周显示；同一课程只在对应开课周出现，可切换教学周查看完整安排。</div></section>

      <section className="catalog wrap"><div className="catalog-top"><div><p className="eyebrow">课程目录</p><h2>从课程库加入方案</h2><p className="catalog-summary">已加载 {catalog.length} 门课程 · 当前显示 {filteredCatalog.length} 门</p></div><div className="data-actions"><button className="quiet-button" onClick={downloadBackup}><Download size={15} />下载备份</button><label className="quiet-button file-label"><Upload size={15} />恢复备份<input type="file" accept="application/json" onChange={(event) => restoreBackup(event.target.files?.[0])} /></label><button className="quiet-button danger-button" onClick={() => { window.localStorage.removeItem(PLAN_STORAGE_KEY); setPlan([]); setDegreeCodes(new Set()); setMessage('已清除本机保存的方案，当前为0学分空方案。'); }}><Trash2 size={15} />清除本机数据</button></div></div><div className="filter-sections"><div className="filter-row"><span className="filter-label">搜索课程</span><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="课程名称、课程代码、教师或学科" /></label><label className="switch-label"><input type="checkbox" checked={onlyNonClosed} onChange={(event) => setOnlyNonClosed(event.target.checked)} /><span className="switch" />只看非闭卷</label></div><div className="filter-row type-row"><span className="filter-label"><Filter size={15} />课程类型</span><div className="type-buttons">{COURSE_TYPES.map((type) => <button key={type} className={activeType === type ? 'active' : ''} onClick={() => setActiveType(type)}>{type}</button>)}</div></div></div><div className="course-table-wrap"><table className="course-table"><thead><tr><th>操作</th><th>课程</th><th>属性 / 学科</th><th>学分</th><th>教学周与节次</th><th>考核</th><th>教师</th></tr></thead><tbody>{filteredCatalog.map((course) => { const isSelected = selectedCodes.has(course.code); const isClosed = course.exam.includes('闭卷'); return <tr key={course.code} className={isClosed ? 'closed-row' : ''}><td><button className={isSelected ? 'added-button' : 'add-button'} onClick={() => addCourse(course)} disabled={isSelected}>{isSelected ? <><Check size={14} />已加入</> : '+ 加入'}</button></td><td><b>{course.name}</b><small>{course.code}</small></td><td><span className="type-pill">{course.type}</span><small>{course.discipline || '公共课'}</small></td><td className="credit-cell">{course.credit.toFixed(1)}</td><td>{course.sessions.length ? course.sessions.map((session) => `${session.day} ${session.periods} · ${session.weeks}`).join('；') : '线上 / 无固定时段'}</td><td><span className={isClosed ? 'exam-pill closed' : 'exam-pill'}>{shortExam(course.exam)}</span></td><td>{course.teacher || '待定'}</td></tr>; })}</tbody></table>{filteredCatalog.length === 0 && <div className="empty-state">没有符合条件的课程。可以放宽搜索条件或关闭“只看非闭卷”。</div>}</div><p className="local-note"><Info size={14} />本机存储已开启：加入课程、学位课勾选和方案备份只保存在这台电脑的浏览器中。课程库来自项目内置的 Excel 提取数据；更新数据时替换 <code>public/data/courses.json</code> 后重新启动即可。</p></section>

      {message && <output className="toast">{message}<button onClick={() => setMessage('')}><X size={15} /></button></output>}
    </main>
  );
}

function Metric({ label, value, target, tone, good }: { label: string; value: string; target: string; tone: string; good: boolean }) { return <div className={`metric ${tone}`}><p>{label}</p><strong>{value} <small>{target}</small></strong><span className={good ? 'metric-check good' : 'metric-check'}>{good ? '已满足' : '待补齐'}</span></div>; }

function Requirement({ label, current, done, note }: { label: string; current: string; done: boolean; note: string }) { return <div className="requirement"><b><span className={done ? 'check-circle done' : 'check-circle'}>{done ? <Check size={12} /> : '·'}</span>{label}</b><span>{current}；{note}。</span></div>; }
