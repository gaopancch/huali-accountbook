import React from 'react';

interface StudyCalendarProps {
  studyData: { [date: string]: number }; // { '2024-01-01': 10 }
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ studyData }) => {
  // 获取最近90天的日期
  const getLast90Days = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  // 根据单词数量返回颜色强度
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 3) return 'bg-green-200';
    if (count <= 6) return 'bg-green-400';
    if (count <= 9) return 'bg-green-600';
    return 'bg-green-700';
  };

  const days = getLast90Days();
  const weeks: Date[][] = [];

  // 将日期按周分组
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">学习日历（最近90天）</h3>

      {/* 日历热力图 */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 mb-4">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const dateStr = day.toISOString().split('T')[0];
                const count = studyData[dateStr] || 0;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={dayIndex}
                    className={`w-8 h-8 rounded ${getColorIntensity(count)} ${
                      isToday ? 'ring-2 ring-blue-500' : ''
                    } flex items-center justify-center text-xs hover:scale-110 transition-transform cursor-pointer`}
                    title={`${dateStr}: ${count} 词`}
                  >
                    {isToday && <span className="text-white font-bold">·</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between text-xs text-gray-600 mt-4">
        <span>少</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100" />
          <div className="w-4 h-4 rounded bg-green-200" />
          <div className="w-4 h-4 rounded bg-green-400" />
          <div className="w-4 h-4 rounded bg-green-600" />
          <div className="w-4 h-4 rounded bg-green-700" />
        </div>
        <span>多</span>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {Object.keys(studyData).length}
            </div>
            <div className="text-xs text-gray-500">活跃天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {Object.values(studyData).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-xs text-gray-500">总单词数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {Object.keys(studyData).length > 0
                ? Math.round(
                    Object.values(studyData).reduce((sum, count) => sum + count, 0) /
                      Object.keys(studyData).length
                  )
                : 0}
            </div>
            <div className="text-xs text-gray-500">日均单词</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCalendar;
